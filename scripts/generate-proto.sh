#!/bin/bash
# generate-proto.sh - Generate protobuf code for all languages
# Usage: ./scripts/generate-proto.sh [--install-buf] [--go-only] [--python-only] [--java-only]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROTO_DIR="$PROJECT_ROOT/proto"

# Flags
INSTALL_BUF=false
GO_ONLY=false
PYTHON_ONLY=false
JAVA_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --install-buf)
            INSTALL_BUF=true
            shift
            ;;
        --go-only)
            GO_ONLY=true
            shift
            ;;
        --python-only)
            PYTHON_ONLY=true
            shift
            ;;
        --java-only)
            JAVA_ONLY=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --install-buf    Install buf if not present"
            echo "  --go-only        Generate only Go code"
            echo "  --python-only    Generate only Python code"
            echo "  --java-only      Generate only Java code (via Gradle)"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Function to install buf
install_buf() {
    echo -e "${BLUE}Installing buf...${NC}"

    # Detect OS and architecture
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    case $ARCH in
        x86_64)
            ARCH="x86_64"
            ;;
        aarch64|arm64)
            ARCH="aarch64"
            ;;
        *)
            echo -e "${RED}Unsupported architecture: $ARCH${NC}"
            exit 1
            ;;
    esac

    # Get latest version
    BUF_VERSION=$(curl -s https://api.github.com/repos/bufbuild/buf/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')

    if [ -z "$BUF_VERSION" ]; then
        BUF_VERSION="1.28.1"  # Fallback version
    fi

    BUF_URL="https://github.com/bufbuild/buf/releases/download/v${BUF_VERSION}/buf-${OS}-${ARCH}"

    echo -e "${BLUE}Downloading buf v${BUF_VERSION}...${NC}"

    # Download to /usr/local/bin if we have permission, otherwise to ~/.local/bin
    if [ -w /usr/local/bin ]; then
        curl -sSL "$BUF_URL" -o /usr/local/bin/buf
        chmod +x /usr/local/bin/buf
    else
        mkdir -p ~/.local/bin
        curl -sSL "$BUF_URL" -o ~/.local/bin/buf
        chmod +x ~/.local/bin/buf
        export PATH="$HOME/.local/bin:$PATH"
        echo -e "${YELLOW}buf installed to ~/.local/bin. Add it to your PATH if not already.${NC}"
    fi

    echo -e "${GREEN}buf v${BUF_VERSION} installed successfully!${NC}"
}

# Add local bin to PATH
export PATH="$HOME/.local/bin:$PATH"

# Check for buf and install if requested
if ! command_exists buf; then
    if [ "$INSTALL_BUF" = true ]; then
        install_buf
    else
        echo -e "${RED}buf is not installed.${NC}"
        echo -e "${YELLOW}Run with --install-buf to install, or install manually:${NC}"
        echo "  brew install bufbuild/buf/buf  # macOS"
        echo "  # or download from https://github.com/bufbuild/buf/releases"
        exit 1
    fi
fi

echo -e "${GREEN}Using buf version: $(buf --version)${NC}"

# Navigate to proto directory
cd "$PROTO_DIR"

# Clean previous generated code
clean_generated() {
    echo -e "${BLUE}Cleaning previous generated code...${NC}"
    rm -rf gen/go gen/python
    mkdir -p gen/go gen/python
}

# Generate Go code using buf with remote plugins (no local Go installation needed)
generate_go() {
    echo -e "${BLUE}Generating Go code...${NC}"

    mkdir -p gen/go

    # Create a temporary buf.gen.yaml for Go generation
    cat > /tmp/buf.gen.go.yaml << 'GOEOF'
version: v2
plugins:
  - remote: buf.build/protocolbuffers/go:v1.32.0
    out: gen/go
    opt:
      - paths=source_relative
  - remote: buf.build/grpc/go:v1.3.0
    out: gen/go
    opt:
      - paths=source_relative
inputs:
  - directory: .
    paths:
      - common/v1
      - user/v1
      - apply/v1
      - notification/v1
GOEOF

    # Use buf generate with the temporary config
    buf generate --template /tmp/buf.gen.go.yaml

    # Cleanup
    rm -f /tmp/buf.gen.go.yaml

    echo -e "${GREEN}Go code generated in proto/gen/go/${NC}"
}

# Generate Python code
generate_python() {
    echo -e "${BLUE}Generating Python code...${NC}"

    mkdir -p gen/python

    # Check for Python grpcio-tools
    if ! python3 -c "import grpc_tools.protoc" 2>/dev/null; then
        echo -e "${YELLOW}Installing Python grpcio-tools...${NC}"
        pip3 install grpcio-tools --quiet
    fi

    # Generate Python code using grpc_tools.protoc
    for dir in common resume match; do
        echo -e "${BLUE}  Compiling $dir proto (Python)...${NC}"
        python3 -m grpc_tools.protoc \
            -I. \
            --python_out=gen/python \
            --grpc_python_out=gen/python \
            --pyi_out=gen/python \
            $dir/v1/*.proto 2>/dev/null || true
    done

    # Create __init__.py files for Python packages
    find gen/python -type d -exec touch {}/__init__.py \;

    # Fix Python imports (relative imports issue)
    echo -e "${BLUE}Fixing Python imports...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        find gen/python -name "*.py" -exec sed -i '' 's/^from common\.v1/from .common.v1/g' {} \; 2>/dev/null || true
        find gen/python -name "*.py" -exec sed -i '' 's/^import common_pb2/from . import common_pb2/g' {} \; 2>/dev/null || true
    else
        # Linux
        find gen/python -name "*.py" -exec sed -i 's/^from common\.v1/from .common.v1/g' {} \; 2>/dev/null || true
        find gen/python -name "*.py" -exec sed -i 's/^import common_pb2/from . import common_pb2/g' {} \; 2>/dev/null || true
    fi

    echo -e "${GREEN}Python code generated in proto/gen/python/${NC}"
}

# Generate Java code (via Gradle)
generate_java() {
    echo -e "${BLUE}Generating Java code via Gradle...${NC}"

    JOB_SERVICE_DIR="$PROJECT_ROOT/services/job-service"

    if [ -f "$JOB_SERVICE_DIR/gradlew" ]; then
        cd "$JOB_SERVICE_DIR"
        ./gradlew generateProto --quiet 2>/dev/null || {
            echo -e "${YELLOW}Gradle generateProto task not available. Java code will be generated on build.${NC}"
        }
        cd "$PROTO_DIR"
    else
        echo -e "${YELLOW}Gradle wrapper not found. Java proto will be generated during build.${NC}"
    fi

    echo -e "${GREEN}Java code generation configured (generated on build)${NC}"
}

# Main execution
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  HireHub Proto Code Generation${NC}"
echo -e "${GREEN}========================================${NC}"

if [ "$GO_ONLY" = true ]; then
    clean_generated
    generate_go
elif [ "$PYTHON_ONLY" = true ]; then
    clean_generated
    generate_python
elif [ "$JAVA_ONLY" = true ]; then
    generate_java
else
    clean_generated
    generate_go
    generate_python
    generate_java
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Proto generation completed!${NC}"
echo -e "${GREEN}========================================${NC}"

# Show generated files summary
echo -e "\n${BLUE}Generated files:${NC}"
if [ -d "gen/go" ]; then
    GO_COUNT=$(find gen/go -name "*.go" 2>/dev/null | wc -l | tr -d ' ')
    echo -e "  Go:     ${GO_COUNT} files in proto/gen/go/"
fi
if [ -d "gen/python" ]; then
    PY_COUNT=$(find gen/python -name "*.py" 2>/dev/null | wc -l | tr -d ' ')
    echo -e "  Python: ${PY_COUNT} files in proto/gen/python/"
fi
echo -e "  Java:   Generated via Gradle in services/job-service/build/"
