#!/usr/bin/env python3
"""
Test runner for Vietnamese Tax Filing API
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    """Run tests with different options"""
    
    # Ensure we're in the right directory
    app_dir = Path(__file__).parent
    os.chdir(app_dir)
    
    # Add app to Python path
    sys.path.insert(0, str(app_dir))
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        test_type = sys.argv[1]
    else:
        test_type = "all"
    
    # Base pytest command
    base_cmd = ["python", "-m", "pytest"]
    
    if test_type == "unit":
        # Run unit tests only
        cmd = base_cmd + [
            "app/tests/",
            "-m", "unit",
            "-v",
            "--tb=short"
        ]
    elif test_type == "integration":
        # Run integration tests only
        cmd = base_cmd + [
            "app/tests/",
            "-m", "integration",
            "-v",
            "--tb=short"
        ]
    elif test_type == "coverage":
        # Run tests with coverage
        cmd = base_cmd + [
            "app/tests/",
            "--cov=app",
            "--cov-report=html",
            "--cov-report=term-missing",
            "-v"
        ]
    elif test_type == "fast":
        # Run fast tests only (exclude slow tests)
        cmd = base_cmd + [
            "app/tests/",
            "-m", "not slow",
            "-v",
            "--tb=line"
        ]
    elif test_type == "auth":
        # Run authentication tests only
        cmd = base_cmd + [
            "app/tests/test_auth.py",
            "-v"
        ]
    elif test_type == "users":
        # Run user management tests only
        cmd = base_cmd + [
            "app/tests/test_users.py",
            "-v"
        ]
    elif test_type == "ai":
        # Run AI-related tests only
        cmd = base_cmd + [
            "app/tests/",
            "-m", "ai",
            "-v"
        ]
    else:
        # Run all tests
        cmd = base_cmd + [
            "app/tests/",
            "-v",
            "--tb=short"
        ]
    
    print(f"Running tests: {' '.join(cmd)}")
    print("=" * 50)
    
    # Run the tests
    try:
        result = subprocess.run(cmd, check=False)
        return result.returncode
    except KeyboardInterrupt:
        print("\nTests interrupted by user")
        return 1
    except Exception as e:
        print(f"Error running tests: {e}")
        return 1


if __name__ == "__main__":
    exit_code = main()
    
    if exit_code == 0:
        print("\n✅ All tests passed!")
    else:
        print(f"\n❌ Tests failed with exit code {exit_code}")
    
    sys.exit(exit_code)
