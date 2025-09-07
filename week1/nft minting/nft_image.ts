const wallet = require("./mym.json");
import path from "path";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { readFile } from "fs/promises"

const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
   try {
        // 2. Load image from local file (make sure image.png is in same folder)
const imagePath = path.join(__dirname, 'tz.jpg');
        const imageBuffer = await readFile(imagePath);

        // 3. Convert to generic file
const imageFile = createGenericFile(imageBuffer, 'tz.jpg', { contentType: 'image/jpeg' });

        // 4. Upload using IRYS
        const [imageUri] = await umi.uploader.upload([imageFile]);

        // 5. Log image URI
        console.log("✅ Image uploaded!");
        console.log("🖼️ Your image URI:", imageUri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
