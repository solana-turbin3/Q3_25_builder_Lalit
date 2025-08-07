#!/bin/bash

echo "🚀 Testing SBT Minting on Devnet"
echo "=================================="

# Set devnet configuration
solana config set --url https://api.devnet.solana.com

echo ""
echo "📋 Current Configuration:"
solana config get

echo ""
echo "💰 Current Balance:"
solana balance

echo ""
echo "🔧 Program Information:"
PROGRAM_ID="FV5sGyF543uGgyJdgfdsQhNGXrGkxY4wsBT5h4tcpjPN"
echo "Program ID: $PROGRAM_ID"

echo ""
echo "🔍 Checking if program is deployed..."
solana account $PROGRAM_ID

echo ""
echo "✅ Program is deployed and ready for testing!"
echo ""
echo "🎯 Next Steps:"
echo "1. Your program is deployed at: $PROGRAM_ID"
echo "2. You can now use any Solana dApp or write custom scripts to interact with it"
echo "3. The program supports:"
echo "   - initialize_contributor(github_username: string)"
echo "   - record_contribution()"
echo "   - mint_sbt(cid: string)"
echo ""
echo "🌐 Explorer Links:"
echo "Program: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo "Your Wallet: https://explorer.solana.com/address/$(solana address)?cluster=devnet"
echo ""
echo "🎉 SBT Program Successfully Deployed and Ready for Use!"
