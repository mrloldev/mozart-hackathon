const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function buildUrl(params: Record<string, string>): string {
  const base = "https://avataaars.io/";
  const query = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `${base}?${query}`;
}

const topTypes = [
  "NoHair",
  "Eyepatch",
  "Hat",
  "Hijab",
  "Turban",
  "WinterHat1",
  "WinterHat2",
  "LongHairBigHair",
  "LongHairBob",
  "LongHairBun",
  "LongHairCurly",
  "LongHairCurvy",
  "LongHairDreads",
  "LongHairFrida",
  "LongHairFro",
  "LongHairFroBand",
  "LongHairNotTooLong",
  "LongHairMiaWallace",
  "LongHairStraight",
  "LongHairStraight2",
  "ShortHairDreads01",
  "ShortHairDreads02",
  "ShortHairFrizzle",
  "ShortHairShaggyMullet",
  "ShortHairShortCurly",
  "ShortHairShortFlat",
  "ShortHairShortRound",
  "ShortHairShortWaved",
  "ShortHairSides",
  "ShortHairTheCaesar",
  "ShortHairTheCaesarSidePart",
];

const hairColors = [
  "Auburn",
  "Black",
  "Blonde",
  "BlondeGolden",
  "Brown",
  "BrownDark",
  "PastelPink",
  "Platinum",
  "Red",
  "SilverGray",
];

const accessoriesTypes = [
  "Blank",
  "Eyepatch",
  "Round",
  "Sunglasses",
  "Wayfarers",
  "Kurt",
];

const clotheTypes = [
  "BlazerShirt",
  "BlazerSweater",
  "CollarSweater",
  "GraphicShirt",
  "Hoodie",
  "Overall",
  "ShirtCrewNeck",
  "ShirtScoopNeck",
  "ShirtVNeck",
];

const clotheColors = [
  "Black",
  "Blue01",
  "Blue02",
  "Blue03",
  "Gray01",
  "Gray02",
  "Heather",
  "PastelBlue",
  "PastelGreen",
  "PastelOrange",
  "PastelRed",
  "PastelYellow",
  "Pink",
  "Red",
  "White",
];

const eyeTypes = [
  "Default",
  "Close",
  "Cry",
  "Dizzy",
  "EyeRoll",
  "Happy",
  "Hearts",
  "Side",
  "Squint",
  "Surprised",
  "Wink",
  "WinkWacky",
];

const eyebrowTypes = [
  "Angry",
  "AngryNatural",
  "Default",
  "DefaultNatural",
  "FlatNatural",
  "FrownNatural",
  "RaisedExcited",
  "RaisedExcitedNatural",
  "SadConcerned",
  "SadConcernedNatural",
  "UnibrowNatural",
  "UpDown",
  "UpDownNatural",
];

const mouthTypes = [
  "Concerned",
  "Default",
  "Disbelief",
  "Eating",
  "Grimace",
  "Sad",
  "ScreamOpen",
  "Serious",
  "Smile",
  "Tongue",
  "Twinkle",
  "Vomit",
];

const skinColors = [
  "Tanned",
  "Yellow",
  "Pale",
  "Light",
  "Brown",
  "DarkBrown",
  "Black",
];

export function randomAvatar(seed?: string): string {
  if (seed) {
    let state = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = (max: number) => {
      state = (state * 9301 + 49297) % 233280;
      return state % max;
    };
    const pickSeeded = <T,>(arr: T[]): T => arr[rng(arr.length)];
    return buildUrl({
      avatarStyle: "Circle",
      topType: pickSeeded(topTypes),
      hairColor: pickSeeded(hairColors),
      accessoriesType: pickSeeded(accessoriesTypes),
      clotheType: pickSeeded(clotheTypes),
      clotheColor: pickSeeded(clotheColors),
      eyeType: pickSeeded(eyeTypes),
      eyebrowType: pickSeeded(eyebrowTypes),
      mouthType: pickSeeded(mouthTypes),
      skinColor: pickSeeded(skinColors),
    });
  }
  return buildUrl({
    avatarStyle: "Circle",
    topType: pick(topTypes),
    hairColor: pick(hairColors),
    accessoriesType: pick(accessoriesTypes),
    clotheType: pick(clotheTypes),
    clotheColor: pick(clotheColors),
    eyeType: pick(eyeTypes),
    eyebrowType: pick(eyebrowTypes),
    mouthType: pick(mouthTypes),
    skinColor: pick(skinColors),
  });
}
