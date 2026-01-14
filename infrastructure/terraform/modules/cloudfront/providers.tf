# CloudFront Module Providers
# Requires us-east-1 provider alias for ACM certificate lookup

terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 5.0"
      configuration_aliases = [aws.us_east_1]
    }
  }
}
