terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Separate, VideVerum-only state. Bucket bootstrapped out-of-band
  # (see README.md "Bootstrap"). S3-native locking (use_lockfile) — no DynamoDB.
  backend "s3" {
    bucket       = "videverum-prod-tfstate-936922781601"
    key          = "videverum/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "videverum"
      Env       = "prod"
      ManagedBy = "terraform"
      Repo      = "jetty-setter/videverum"
    }
  }
}
