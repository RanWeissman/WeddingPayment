# ----------------------------------------------------
# DynamoDB Table
# ----------------------------------------------------
resource "aws_dynamodb_table" "config_table" {
  name         = "Gift4Event-Configurations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "slug"

  point_in_time_recovery {
    enabled = true
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  attribute {
    name = "slug"
    type = "S"
  }
}

# ----------------------------------------------------
# Lambda Function
# ----------------------------------------------------
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
}

# Automatically generates and persists a 256-bit (32-byte = 64-hex-char) key
# in the encrypted S3 Terraform state backend (zero manual SSM or IAM steps).
resource "random_id" "encryption_key" {
  byte_length = 32
}

resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-role"
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

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_exec.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-api:*"
      },
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem"
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.config_table.arn
      }
    ]
  })
}

resource "aws_lambda_function" "api_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-api"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME     = aws_dynamodb_table.config_table.name
      ANALYTICS_URL  = "/api/analytics"
      ENCRYPTION_KEY = var.encryption_key != "" ? var.encryption_key : random_id.encryption_key.hex
    }
  }
}

# ----------------------------------------------------
# API Gateway
# ----------------------------------------------------
resource "aws_api_gateway_rest_api" "api" {
  name = "${var.project_name}-api"
}

resource "aws_api_gateway_resource" "api_base" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "api"
}

# /api/create
resource "aws_api_gateway_resource" "create" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.api_base.id
  path_part   = "create"
}

resource "aws_api_gateway_method" "create_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.create.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "create_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.create.id
  http_method             = aws_api_gateway_method.create_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_api_gateway_method" "create_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.create.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "create_options_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.create.id
  http_method             = aws_api_gateway_method.create_options.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

# /api/config
resource "aws_api_gateway_resource" "config" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.api_base.id
  path_part   = "config"
}

# /api/config/{slug}
resource "aws_api_gateway_resource" "config_slug" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.config.id
  path_part   = "{slug}"
}

resource "aws_api_gateway_method" "config_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.config_slug.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "config_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.config_slug.id
  http_method             = aws_api_gateway_method.config_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_api_gateway_method" "config_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.config_slug.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "config_options_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.config_slug.id
  http_method             = aws_api_gateway_method.config_options.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

# /api/analytics
resource "aws_api_gateway_resource" "analytics" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.api_base.id
  path_part   = "analytics"
}

resource "aws_api_gateway_method" "analytics_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.analytics.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "analytics_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.analytics.id
  http_method             = aws_api_gateway_method.analytics_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.analytics_handler.invoke_arn
}

resource "aws_api_gateway_method" "analytics_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.analytics.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "analytics_options_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.analytics.id
  http_method             = aws_api_gateway_method.analytics_options.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.analytics_handler.invoke_arn
}

resource "aws_lambda_permission" "apigw_analytics" {
  statement_id  = "AllowAPIGatewayInvokeAnalytics"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.analytics_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

# /api/payment-details
resource "aws_api_gateway_resource" "payment_details" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.api_base.id
  path_part   = "payment-details"
}

# /api/payment-details/{slug}
resource "aws_api_gateway_resource" "payment_details_slug" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.payment_details.id
  path_part   = "{slug}"
}

resource "aws_api_gateway_method" "payment_details_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.payment_details_slug.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "payment_details_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.payment_details_slug.id
  http_method             = aws_api_gateway_method.payment_details_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_api_gateway_method" "payment_details_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.payment_details_slug.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "payment_details_options_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.payment_details_slug.id
  http_method             = aws_api_gateway_method.payment_details_options.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_api_gateway_deployment" "api_deploy" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.create.id,
      aws_api_gateway_method.create_post.id,
      aws_api_gateway_integration.create_lambda.id,
      aws_api_gateway_resource.config_slug.id,
      aws_api_gateway_method.config_get.id,
      aws_api_gateway_integration.config_lambda.id,
      aws_api_gateway_resource.payment_details_slug.id,
      aws_api_gateway_method.payment_details_get.id,
      aws_api_gateway_integration.payment_details_lambda.id,
      aws_api_gateway_resource.analytics.id,
      aws_api_gateway_method.analytics_post.id,
      aws_api_gateway_integration.analytics_lambda.id
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.api_deploy.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = "prod"
}

# ----------------------------------------------------
# CloudFront Function (Edge Router)
# ----------------------------------------------------
resource "aws_cloudfront_function" "router" {
  name    = "${var.project_name}-router"
  runtime = "cloudfront-js-1.0"
  comment = "Edge router for short URLs"
  publish = true
  code    = file("${path.module}/cloudfront_router.js")
}

# ----------------------------------------------------
# Security Monitoring & SNS Alerts (Security Section 6)
# ----------------------------------------------------
resource "aws_sns_topic" "security_alerts" {
  name = "${var.project_name}-security-alerts"
}

resource "aws_sns_topic_subscription" "security_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_log_metric_filter" "security_blocks" {
  name           = "${var.project_name}-security-blocks"
  pattern        = "?\"Quarantined IP\" ?\"Rate limit exceeded\""
  log_group_name = "/aws/lambda/${aws_lambda_function.api_handler.function_name}"

  metric_transformation {
    name          = "SecurityBlockCount"
    namespace     = "Gift4Event/Security"
    value         = "1"
    default_value = "0"
  }

  depends_on = [aws_lambda_function.api_handler]
}

resource "aws_cloudwatch_metric_alarm" "api_scraping_alarm" {
  alarm_name          = "${var.project_name}-api-scraping-detected"
  alarm_description   = "Triggers when an IP is quarantined for 404 brute-forcing or exceeds API rate limits"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "SecurityBlockCount"
  namespace           = "Gift4Event/Security"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.security_alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_scan_alarm" {
  alarm_name          = "${var.project_name}-dynamodb-bulk-scan-detected"
  alarm_description   = "Triggers if a bulk Scan operation returns items from Gift4Event-Configurations"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ReturnedItemCount"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.config_table.name
  }

  alarm_actions = [aws_sns_topic.security_alerts.arn]
}
