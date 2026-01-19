#!/bin/bash
# Deploy Next.js static assets to S3 for CloudFront delivery
#
# Usage: ./scripts/deploy-frontend-static.sh [--build] [--invalidate]
#   --build       : Run npm build before uploading
#   --invalidate  : Invalidate CloudFront cache after upload
#
# Prerequisites:
#   - AWS CLI configured with appropriate permissions
#   - Node.js and npm installed (for --build)

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/services/web-frontend"
S3_BUCKET="hirehub-demo-frontend"
CLOUDFRONT_DISTRIBUTION_ID="E2VCUUX4XBUNTO"
AWS_REGION="ap-northeast-2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
DO_BUILD=false
DO_INVALIDATE=false

for arg in "$@"; do
    case $arg in
        --build)
            DO_BUILD=true
            shift
            ;;
        --invalidate)
            DO_INVALIDATE=true
            shift
            ;;
        *)
            ;;
    esac
done

echo -e "${GREEN}=== Next.js Static Assets Deployment ===${NC}"
echo "S3 Bucket: $S3_BUCKET"
echo "CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo ""

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Frontend directory not found: $FRONTEND_DIR${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"

# Build if requested
if [ "$DO_BUILD" = true ]; then
    echo -e "${YELLOW}Building Next.js application...${NC}"

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi

    npm run build
    echo -e "${GREEN}Build completed!${NC}"
    echo ""
fi

# Check if .next/static exists
if [ ! -d ".next/static" ]; then
    echo -e "${RED}Error: .next/static directory not found. Run with --build flag or build manually first.${NC}"
    exit 1
fi

# Upload _next/static to S3
echo -e "${YELLOW}Uploading _next/static to S3...${NC}"
aws s3 sync .next/static "s3://$S3_BUCKET/_next/static" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --region "$AWS_REGION"
echo -e "${GREEN}Uploaded _next/static${NC}"

# Upload public directory (if exists)
if [ -d "public" ] && [ "$(ls -A public 2>/dev/null)" ]; then
    echo -e "${YELLOW}Uploading public assets to S3...${NC}"
    aws s3 sync public "s3://$S3_BUCKET" \
        --exclude "*.html" \
        --cache-control "public, max-age=86400" \
        --region "$AWS_REGION"
    echo -e "${GREEN}Uploaded public assets${NC}"
fi

echo ""
echo -e "${GREEN}S3 upload completed!${NC}"

# Invalidate CloudFront cache if requested
if [ "$DO_INVALIDATE" = true ]; then
    echo ""
    echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"

    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/_next/static/*" "/images/*" "/favicon.ico" "/robots.txt" \
        --query 'Invalidation.Id' \
        --output text \
        --region us-east-1)

    echo "Invalidation created: $INVALIDATION_ID"
    echo "Cache invalidation is in progress (may take a few minutes)"
fi

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Verify at: https://msa-demo.aws.atomai.click"
