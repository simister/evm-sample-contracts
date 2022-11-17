import { ethers } from "hardhat";
import {
  SimpleBase,
  SimpleEquippable,
  RMRKEquipRenderUtils,
} from "../typechain-types";
import { ContractTransaction } from "ethers";

const pricePerMint = ethers.utils.parseEther("0.0001");
const totalBirds = 5;
const deployedKanariaAddress = "";
const deployedGemAddress = "";
const deployedBaseAddress = "";
const deployedViewsAddress = "";

async function main() {
  const [kanaria, gem, base, views] = await deployContracts();
  // const [kanaria, gem, base, views] = await retrieveContracts();

  // Notice that most of these steps will happen at different points in time
  // Here we do all in one go to demonstrate how to use it.
  await setupBase(base, gem.address);
  await mintTokens(kanaria, gem);
  await addKanariaAssets(kanaria, base.address);
  await addGemAssets(gem, kanaria.address, base.address);
  await equipGems(kanaria);
  await composeEquippables(views, kanaria.address);
}

async function retrieveContracts(): Promise<
  [SimpleEquippable, SimpleEquippable, SimpleBase, RMRKEquipRenderUtils]
> {
  const contractFactory = await ethers.getContractFactory("SimpleEquippable");
  const baseFactory = await ethers.getContractFactory("SimpleBase");
  const viewsFactory = await ethers.getContractFactory("RMRKEquipRenderUtils");

  const kanaria: SimpleEquippable = contractFactory.attach(
    deployedKanariaAddress
  );
  const gem: SimpleEquippable = contractFactory.attach(deployedGemAddress);
  const base: SimpleBase = baseFactory.attach(deployedBaseAddress);
  const views: RMRKEquipRenderUtils = await viewsFactory.attach(
    deployedViewsAddress
  );

  return [kanaria, gem, base, views];
}

async function deployContracts(): Promise<
  [SimpleEquippable, SimpleEquippable, SimpleBase, RMRKEquipRenderUtils]
> {
  const [beneficiary] = await ethers.getSigners();
  const contractFactory = await ethers.getContractFactory("SimpleEquippable");
  const baseFactory = await ethers.getContractFactory("SimpleBase");
  const viewsFactory = await ethers.getContractFactory("RMRKEquipRenderUtils");

  const kanaria: SimpleEquippable = await contractFactory.deploy(
    "Kanaria",
    "KAN",
    1000,
    pricePerMint,
    "ipfs://collectionMeta",
    "ipfs://tokenMeta",
    await beneficiary.getAddress(),
    10
  );
  const gem: SimpleEquippable = await contractFactory.deploy(
    "Gem",
    "GM",
    3000,
    pricePerMint,
    "ipfs://collectionMeta",
    "ipfs://tokenMeta",
    await beneficiary.getAddress(),
    10
  );
  const base: SimpleBase = await baseFactory.deploy("KB", "svg");
  const views: RMRKEquipRenderUtils = await viewsFactory.deploy();

  await kanaria.deployed();
  await gem.deployed();
  await base.deployed();
  await views.deployed();
  console.log(
    `Sample contracts deployed to ${kanaria.address}, ${gem.address} and ${base.address}`
  );

  return [kanaria, gem, base, views];
}

async function setupBase(base: SimpleBase, gemAddress: string): Promise<void> {
  console.log("Setting up Base");
  // Setup base with 2 fixed part options for background, head, body and wings.
  // Also 3 slot options for gems
  const tx = await base.addPartList([
    {
      // Background option 1
      partId: 1,
      part: {
        itemType: 2, // Fixed
        z: 0,
        equippable: [],
        metadataURI: "ipfs://backgrounds/1.svg",
      },
    },
    {
      // Background option 2
      partId: 2,
      part: {
        itemType: 2, // Fixed
        z: 0,
        equippable: [],
        metadataURI: "ipfs://backgrounds/2.svg",
      },
    },
    {
      // Head option 1
      partId: 3,
      part: {
        itemType: 2, // Fixed
        z: 3,
        equippable: [],
        metadataURI: "ipfs://heads/1.svg",
      },
    },
    {
      // Head option 2
      partId: 4,
      part: {
        itemType: 2, // Fixed
        z: 3,
        equippable: [],
        metadataURI: "ipfs://heads/2.svg",
      },
    },
    {
      // Body option 1
      partId: 5,
      part: {
        itemType: 2, // Fixed
        z: 2,
        equippable: [],
        metadataURI: "ipfs://body/1.svg",
      },
    },
    {
      // Body option 2
      partId: 6,
      part: {
        itemType: 2, // Fixed
        z: 2,
        equippable: [],
        metadataURI: "ipfs://body/2.svg",
      },
    },
    {
      // Wings option 1
      partId: 7,
      part: {
        itemType: 2, // Fixed
        z: 1,
        equippable: [],
        metadataURI: "ipfs://wings/1.svg",
      },
    },
    {
      // Wings option 2
      partId: 8,
      part: {
        itemType: 2, // Fixed
        z: 1,
        equippable: [],
        metadataURI: "ipfs://wings/2.svg",
      },
    },
    {
      // Gems slot 1
      partId: 9,
      part: {
        itemType: 1, // Slot
        z: 4,
        equippable: [gemAddress], // Only gems tokens can be equipped here
        metadataURI: "",
      },
    },
    {
      // Gems slot 2
      partId: 10,
      part: {
        itemType: 1, // Slot
        z: 4,
        equippable: [gemAddress], // Only gems tokens can be equipped here
        metadataURI: "",
      },
    },
    {
      // Gems slot 3
      partId: 11,
      part: {
        itemType: 1, // Slot
        z: 4,
        equippable: [gemAddress], // Only gems tokens can be equipped here
        metadataURI: "",
      },
    },
  ]);
  await tx.wait();
  console.log("Base is set");
}

async function mintTokens(
  kanaria: SimpleEquippable,
  gem: SimpleEquippable
): Promise<void> {
  console.log("Minting tokens");
  const [owner] = await ethers.getSigners();

  // Mint some kanarias
  console.log("Minting Kanaria tokens");
  let tx = await kanaria.mint(owner.address, totalBirds, {
    value: pricePerMint.mul(totalBirds),
  });
  await tx.wait();
  console.log(`Minted ${totalBirds} kanarias`);

  // Mint 3 gems into each kanaria
  console.log("Nest-minting Gem tokens");
  let allTx: ContractTransaction[] = [];
  for (let i = 1; i <= totalBirds; i++) {
    let tx = await gem.nestMint(kanaria.address, 3, i, {
      value: pricePerMint.mul(3),
    });
    allTx.push(tx);
  }
  await Promise.all(allTx.map((tx) => tx.wait()));
  console.log(`Minted 3 gems into each kanaria`);

  // Accept 1 gem for each kanaria
  console.log("Accepting Gems");
  for (let i = 0; i < 3; i++) {
    allTx = [];
    for (let tokenId = 1; tokenId <= totalBirds; tokenId++) {
      let tx = await kanaria.acceptChild(tokenId, 0);
      allTx.push(tx);
    }
    await Promise.all(allTx.map((tx) => tx.wait()));
    console.log(`Accepted 1 gem for each kanaria`);
  }
}

async function addKanariaAssets(
  kanaria: SimpleEquippable,
  baseAddress: string
): Promise<void> {
  console.log("Adding Kanaria assets");
  const assetDefaultId = 1;
  const assetComposedId = 2;
  let allTx: ContractTransaction[] = [];
  let tx = await kanaria.addAssetEntry(
    {
      id: assetDefaultId,
      equippableGroupId: 0, // Only used for assets meant to equip into others
      baseAddress: ethers.constants.AddressZero, // base is not needed here
      metadataURI: "ipfs://default.png",
    },
    [],
    []
  );
  allTx.push(tx);

  tx = await kanaria.addAssetEntry(
    {
      id: assetComposedId,
      equippableGroupId: 0, // Only used for assets meant to equip into others
      baseAddress: baseAddress, // Since we're using parts, we must define the base
      metadataURI: "ipfs://meta1.json",
    },
    [1, 3, 5, 7], // We're using first background, head, body and wings
    [9, 10, 11] // We state that this can receive the 3 slot parts for gems
  );
  allTx.push(tx);
  // Wait for both assets to be added
  await Promise.all(allTx.map((tx) => tx.wait()));
  console.log("Added 2 asset entries");

  // Add assets to token
  const tokenId = 1;
  allTx = [
    await kanaria.addAssetToToken(tokenId, assetDefaultId, 0),
    await kanaria.addAssetToToken(tokenId, assetComposedId, 0),
  ];
  await Promise.all(allTx.map((tx) => tx.wait()));
  console.log("Added assets to token 1");

  // Accept both assets:
  tx = await kanaria.acceptAsset(tokenId, 0);
  await tx.wait();
  tx = await kanaria.acceptAsset(tokenId, 0);
  await tx.wait();
  console.log("Assets accepted");
}

async function addGemAssets(
  gem: SimpleEquippable,
  kanariaAddress: string,
  baseAddress: string
): Promise<void> {
  console.log("Adding Gem assets");
  // We'll add 4 assets for each gem, a full version and 3 versions matching each slot.
  // We will have only 2 types of gems -> 4x2: 8 assets.
  // This is not composed by others, so fixed and slot parts are never used.
  const gemVersions = 4;

  // These refIds are used from the child's perspective, to group assets that can be equipped into a parent
  // With it, we avoid the need to do set it asset by asset
  const equippableRefIdLeftGem = 1;
  const equippableRefIdMidGem = 2;
  const equippableRefIdRightGem = 3;

  // We can do a for loop, but this makes it clearer.
  console.log("Adding asset entries");
  let allTx = [
    await gem.addAssetEntry(
      // Full version for first type of gem, no need of refId or base
      {
        id: 1,
        equippableGroupId: 0,
        baseAddress: baseAddress,
        metadataURI: `ipfs://gems/typeA/full.svg`,
      },
      [],
      []
    ),
    await gem.addAssetEntry(
      // Equipped into left slot for first type of gem
      {
        id: 2,
        equippableGroupId: equippableRefIdLeftGem,
        baseAddress: baseAddress,
        metadataURI: `ipfs://gems/typeA/left.svg`,
      },
      [],
      []
    ),
    await gem.addAssetEntry(
      // Equipped into mid slot for first type of gem
      {
        id: 3,
        equippableGroupId: equippableRefIdMidGem,
        baseAddress: baseAddress,
        metadataURI: `ipfs://gems/typeA/mid.svg`,
      },
      [],
      []
    ),
    await gem.addAssetEntry(
      // Equipped into left slot for first type of gem
      {
        id: 4,
        equippableGroupId: equippableRefIdRightGem,
        baseAddress: baseAddress,
        metadataURI: `ipfs://gems/typeA/right.svg`,
      },
      [],
      []
    ),
    await gem.addAssetEntry(
      // Full version for second type of gem, no need of refId or base
      {
        id: 5,
        equippableGroupId: 0,
        baseAddress: ethers.constants.AddressZero,
        metadataURI: `ipfs://gems/typeB/full.svg`,
      },
      [],
      []
    ),
    await gem.addAssetEntry(
      // Equipped into left slot for second type of gem
      {
        id: 6,
        equippableGroupId: equippableRefIdLeftGem,
        baseAddress: baseAddress,
        metadataURI: `ipfs://gems/typeB/left.svg`,
      },
      [],
      []
    ),
    await gem.addAssetEntry(
      // Equipped into mid slot for second type of gem
      {
        id: 7,
        equippableGroupId: equippableRefIdMidGem,
        baseAddress: baseAddress,
        metadataURI: `ipfs://gems/typeB/mid.svg`,
      },
      [],
      []
    ),
    await gem.addAssetEntry(
      // Equipped into right slot for second type of gem
      {
        id: 8,
        equippableGroupId: equippableRefIdRightGem,
        baseAddress: baseAddress,
        metadataURI: `ipfs://gems/typeB/right.svg`,
      },
      [],
      []
    ),
  ];

  await Promise.all(allTx.map((tx) => tx.wait()));
  console.log(
    "Added 8 gem assets. 2 Types of gems with full, left, mid and right versions."
  );

  // 9, 10 and 11 are the slot part ids for the gems, defined on the base.
  // e.g. Any asset on gem, which sets its equippableGroupId to equippableRefIdLeftGem
  //      will be considered a valid equip into any kanaria on slot 9 (left gem).
  console.log("Setting valid parent reference IDs");
  allTx = [
    await gem.setValidParentForEquippableGroup(equippableRefIdLeftGem, kanariaAddress, 9),
    await gem.setValidParentForEquippableGroup(equippableRefIdMidGem, kanariaAddress, 10),
    await gem.setValidParentForEquippableGroup(equippableRefIdRightGem, kanariaAddress, 11),
  ];
  await Promise.all(allTx.map((tx) => tx.wait()));

  // We add assets of type A to gem 1 and 2, and type Bto gem 3. Both are nested into the first kanaria
  // This means gems 1 and 2 will have the same asset, which is totally valid.
  console.log("Add assets to tokens");
  allTx = [
    await gem.addAssetToToken(1, 1, 0),
    await gem.addAssetToToken(1, 2, 0),
    await gem.addAssetToToken(1, 3, 0),
    await gem.addAssetToToken(1, 4, 0),
    await gem.addAssetToToken(2, 1, 0),
    await gem.addAssetToToken(2, 2, 0),
    await gem.addAssetToToken(2, 3, 0),
    await gem.addAssetToToken(2, 4, 0),
    await gem.addAssetToToken(3, 5, 0),
    await gem.addAssetToToken(3, 6, 0),
    await gem.addAssetToToken(3, 7, 0),
    await gem.addAssetToToken(3, 8, 0),
  ];
  await Promise.all(allTx.map((tx) => tx.wait()));
  console.log("Added 4 assets to each of 3 gems.");

  // We accept each asset for both gems
  for (let i = 0; i < gemVersions; i++) {
    allTx = [
      await gem.acceptAsset(1, 0),
      await gem.acceptAsset(2, 0),
      await gem.acceptAsset(3, 0),
    ];
    await Promise.all(allTx.map((tx) => tx.wait()));
  }
  console.log("Accepted 4 assets to each of 3 gems.");
}

async function equipGems(kanaria: SimpleEquippable): Promise<void> {
  console.log("Equipping gems");
  const allTx = [
    await kanaria.equip({
      tokenId: 1, // Kanaria 1
      childIndex: 0, // Gem 1 is on position 0
      assetId: 2, // Asset for the kanaria which is composable
      slotPartId: 9, // left gem slot
      childAssetId: 2, // Asset id for child meant for the left gem
    }),
    await kanaria.equip({
      tokenId: 1, // Kanaria 1
      childIndex: 2, // Gem 2 is on position 2 (positions are shifted when accepting children)
      assetId: 2, // Asset for the kanaria which is composable
      slotPartId: 10, // mid gem slot
      childAssetId: 3, // Asset id for child meant for the mid gem
    }),
    await kanaria.equip({
      tokenId: 1, // Kanaria 1
      childIndex: 1, // Gem 3 is on position 1
      assetId: 2, // Asset for the kanaria which is composable
      slotPartId: 11, // right gem slot
      childAssetId: 8, // Asset id for child meant for the right gem
    }),
  ];
  await Promise.all(allTx.map((tx) => tx.wait()));
  console.log("Equipped 3 gems into first kanaria");
}

async function composeEquippables(
  views: RMRKEquipRenderUtils,
  kanariaAddress: string
): Promise<void> {
  console.log("Composing equippables");
  const tokenId = 1;
  const assetId = 2;
  console.log(
    "Composed: ",
    await views.composeEquippables(kanariaAddress, tokenId, assetId)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
