# ----------------------------------------------------
# Analytics S3 Data Lake Bucket
# ----------------------------------------------------
resource "aws_s3_bucket" "analytics_logs" {
  bucket = "click-analytics-logs-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "analytics_logs" {
  bucket                  = aws_s3_bucket.analytics_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ----------------------------------------------------
# Analytics Lambda Validation Engine
# ----------------------------------------------------
data "archive_file" "analytics_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/analytics"
  output_path = "${path.module}/analytics_lambda.zip"
}

resource "aws_iam_role" "analytics_lambda_exec" {
  name = "${var.project_name}-analytics-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "analytics_lambda_policy" {
  name = "${var.project_name}-analytics-lambda-policy"
  role = aws_iam_role.analytics_lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "s3:PutObject"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.analytics_logs.arn}/*"
      }
    ]
  })
}

resource "aws_lambda_function" "analytics_handler" {
  filename         = data.archive_file.analytics_lambda_zip.output_path
  function_name    = "${var.project_name}-analytics"
  role             = aws_iam_role.analytics_lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.analytics_lambda_zip.output_base64sha256

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.analytics_logs.bucket
    }
  }
}

resource "aws_lambda_function_url" "analytics_url" {
  function_name      = aws_lambda_function.analytics_handler.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_origins     = ["*"]
    allow_methods     = ["POST", "OPTIONS"]
    allow_headers     = ["content-type"]
    max_age           = 86400
  }
}

# ----------------------------------------------------
# AWS Glue Catalog (for Athena)
# ----------------------------------------------------
resource "aws_glue_catalog_database" "analytics_db" {
  name = "gift4event_analytics_db"
}

resource "aws_glue_catalog_table" "analytics_table" {
  name          = "gift4event_analytics"
  database_name = aws_glue_catalog_database.analytics_db.name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    EXTERNAL              = "TRUE"
    "classification"      = "json"
  }

  partition_keys {
    name = "year"
    type = "string"
  }
  partition_keys {
    name = "month"
    type = "string"
  }
  partition_keys {
    name = "day"
    type = "string"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.analytics_logs.bucket}/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"

    ser_de_info {
      serialization_library = "org.openx.data.jsonserde.JsonSerDe"
      parameters = {
        "paths" = "action_type,event_id,timestamp"
      }
    }

    columns {
      name = "event_id"
      type = "string"
    }
    columns {
      name = "timestamp"
      type = "string"
    }
    columns {
      name = "action_type"
      type = "string"
    }
  }
}

# ----------------------------------------------------
# Athena Workgroup
# ----------------------------------------------------
resource "aws_athena_workgroup" "analytics_wg" {
  name = "gift4event_analytics_wg"
  
  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.analytics_logs.bucket}/athena-results/"
    }
  }
  force_destroy = true
}
