terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket                 = "wedding-tf-state-ran-2026"
    key                    = "terraform.tfstate"
    region                 = "il-central-1"
    dynamodb_table         = "terraform-lock"
    encrypt                = true
    skip_region_validation = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
