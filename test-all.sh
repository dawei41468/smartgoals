#!/bin/bash

# SmartGoals Test Runner
# Runs both frontend and backend tests

echo "🚀 Starting SmartGoals Test Suite..."
echo "====================================="

# Frontend Tests
echo ""
echo "📱 Running Frontend Tests..."
echo "----------------------------"
npm test -- --run

# Backend Tests
echo ""
echo "🔧 Running Backend Tests..."
echo "---------------------------"
cd api
pytest --cov=api --cov-report=term-missing
cd ..

echo ""
echo "✅ All tests completed!"
echo "======================"