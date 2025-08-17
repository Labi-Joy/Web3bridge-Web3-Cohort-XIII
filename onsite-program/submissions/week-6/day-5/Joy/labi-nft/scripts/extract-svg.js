const { ethers } = require("hardhat");

async function main() {
  // Replace with your deployed contract address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("Extracting SVG from DynamicTimeNFT...");

  const DynamicTimeNFT = await ethers.getContractFactory("DynamicTimeNFT");
  const contract = DynamicTimeNFT.attach(contractAddress);

  try {
    // Get the tokenURI (this contains the SVG)
    const tokenURI = await contract.tokenURI(0);
    console.log("Full tokenURI:", tokenURI);
    
    // Decode the base64 JSON
    const base64Json = tokenURI.split("data:application/json;base64,")[1];
    const jsonData = JSON.parse(Buffer.from(base64Json, 'base64').toString());
    
    console.log("\n📄 Decoded JSON Metadata:");
    console.log(JSON.stringify(jsonData, null, 2));
    
    // Extract and decode the SVG
    const svgDataUri = jsonData.image;
    const base64Svg = svgDataUri.split("data:image/svg+xml;base64,")[1];
    const svgContent = Buffer.from(base64Svg, 'base64').toString();
    
    console.log("\n🎨 Raw SVG Content:");
    console.log(svgContent);
    
    // Save SVG to file
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `dynamic-nft-${timestamp}.svg`;
    
    fs.writeFileSync(filename, svgContent);
    console.log(`\n💾 SVG saved to: ${filename}`);
    
    // Create HTML file to view SVG
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Dynamic Time NFT SVG</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
        .svg-container { margin: 20px; }
    </style>
</head>
<body>
    <h1>🎨 Dynamic Time NFT SVG</h1>
    <p>Generated at: ${new Date().toLocaleString()}</p>
    <div class="svg-container">
        ${svgContent}
    </div>
    <p><strong>Note:</strong> This SVG shows the time when the contract was queried.</p>
</body>
</html>`;
    
    const htmlFilename = `dynamic-nft-${timestamp}.html`;
    fs.writeFileSync(htmlFilename, htmlContent);
    console.log(`📄 HTML viewer saved to: ${htmlFilename}`);
    
    console.log("\n🌐 To view:");
    console.log(`open ${htmlFilename}`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes("Token does not exist")) {
      console.log("\n📋 First mint an NFT:");
      console.log("npm run deploy:localhost");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });