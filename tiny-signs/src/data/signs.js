import familySigns from "./familySigns.json";
import { faithReferences } from "./faithReferences.js";
import { extraSigns } from "./extraSigns.js";
import media from "./media.json";

const lifeprintSource = (path) => ({
  label: "ASL University",
  url: `https://www.lifeprint.com/asl101/pages-signs/${path}`
});

const componentChecks = ({ shape, palm, place, move }) => [
  { id: "shape", label: "Handshape", prompt: shape },
  { id: "palm", label: "Palm", prompt: palm },
  { id: "place", label: "Location", prompt: place },
  { id: "move", label: "Movement", prompt: move }
];

const signCatalog = [
  {
    id: "milk",
    word: "Milk",
    stage: "birth",
    stageLabel: "Model from birth",
    routine: "Feeding",
    hands: "one",
    shape: "A relaxed C hand that closes into an S hand (a fist)",
    place: "Neutral space in front of your torso",
    palm: "Thumb side up, with the palm angled inward or sideways",
    move: "Close the curved hand into a fist and relax it again. Keep your forearm still—only the hand closes.",
    repetitions: "One or two closes",
    teachingMoment: "Right before nursing or offering a bottle, say “milk,” make the sign, pause briefly, then feed your baby.",
    commonMistake: "Pumping the whole arm up and down instead of opening and closing the hand.",
    checks: componentChecks({
      shape: "I start with a relaxed C and finish with a fist.",
      palm: "My thumb stays on top and my palm does not face straight down.",
      place: "My hand stays in the comfortable space in front of my torso.",
      move: "My hand closes while my arm stays quiet."
    }),
    source: lifeprintSource("m/milk.htm"),
    cue: {
      summary: "Curved hand → fist",
      frames: [
        { shape: "c", label: "Start: C" },
        { shape: "fist", label: "Close", motion: "squeeze" },
        { shape: "c", label: "Open" },
        { shape: "fist", label: "Close again", motion: "squeeze" }
      ]
    },
    careNote: "Respond to hunger cues; never delay a feeding while waiting for your baby to sign."
  },
  {
    id: "sleep",
    word: "Sleep",
    stage: "birth",
    stageLabel: "Model from birth",
    routine: "Sleep",
    hands: "one",
    shape: "Begin with an open hand; finish with the fingertips and thumb together in a flattened O",
    place: "Start in front of the upper face and finish in front of the chin or slightly lower",
    palm: "Palm faces you",
    move: "Lower the hand toward the chin while bringing the fingers together to meet the thumb.",
    repetitions: "One slow movement",
    teachingMoment: "At the same point in each nap or bedtime routine, say “sleep,” sign once, and continue the routine.",
    commonMistake: "Ending in a tight fist; the fingertips should gather to the thumb instead.",
    checks: componentChecks({
      shape: "My open hand gathers into a flattened O, not a fist.",
      palm: "My palm faces me throughout the sign.",
      place: "I begin in front of my upper face and finish near my chin.",
      move: "My hand lowers smoothly as my fingers close."
    }),
    source: lifeprintSource("s/sleep.htm"),
    cue: {
      summary: "Open hand lowers and gently closes",
      frames: [
        { shape: "open", label: "Open near face" },
        { shape: "pinch", label: "Close near chin", motion: "down-close" }
      ]
    },
    careNote: "This is a routine cue, not sleep-safety guidance; continue following your pediatric care team’s safe-sleep advice."
  },
  {
    id: "diaper",
    word: "Diaper",
    stage: "birth",
    stageLabel: "Model from birth",
    routine: "Diaper changes",
    hands: "two",
    shape: "Both hands use a modified 3: thumb, index, and middle fingers extended; ring and pinky folded",
    place: "At the left and right sides of your lower waist",
    palm: "Palms face down, with thumbs closest to the torso",
    move: "Tap the index and middle fingers to the thumb on both hands twice, like fastening diaper tabs.",
    repetitions: "Two taps",
    teachingMoment: "Before each change, while your baby is secure, say “diaper,” sign twice, then begin.",
    commonMistake: "Making the sign high on the chest instead of down at the waist.",
    checks: componentChecks({
      shape: "Only my thumb, index, and middle fingers take part in the tapping shape.",
      palm: "Both palms face down and my thumbs sit closest to my body.",
      place: "My hands are at the two sides of my lower waist.",
      move: "Both pairs of fingers tap their thumbs twice."
    }),
    source: lifeprintSource("d/diaper.htm"),
    cue: {
      summary: "Two modified-3 hands fasten at the waist",
      frames: [
        { shape: "two-three", label: "Open at waist" },
        { shape: "two-pinch", label: "Tap" , motion: "pinch" },
        { shape: "two-three", label: "Open" },
        { shape: "two-pinch", label: "Tap again", motion: "pinch" }
      ]
    },
    careNote: "Make this two-hand sign before placing your baby on a changing surface, or only while your baby is fully secure."
  },
  {
    id: "mom",
    word: "Mom",
    stage: "birth",
    stageLabel: "Model from birth",
    routine: "People",
    hands: "one",
    shape: "An open 5 hand with the fingers comfortably spread",
    place: "The thumb touches or comes close to the chin",
    palm: "Palm faces sideways",
    move: "Make one light thumb contact at the chin. A light double tap is also a common variation.",
    repetitions: "One contact",
    teachingMoment: "When Mom comes into view, say “Mom,” make the sign, and warmly direct your baby’s attention toward her.",
    commonMistake: "Touching the forehead, which is the usual location for Dad.",
    checks: componentChecks({
      shape: "My hand is open with five relaxed fingers.",
      palm: "My palm faces to the side rather than toward my face.",
      place: "My thumb reaches my chin or comes very close to it.",
      move: "I use one light, clear contact."
    }),
    source: lifeprintSource("m/momdad.htm"),
    cue: {
      summary: "Open 5 hand, thumb to chin",
      frames: [{ shape: "open", label: "Thumb to chin", motion: "touch-chin" }]
    },
    careNote: "Use the family name you actually say, and model it without turning recognition into a quiz."
  },
  {
    id: "dad",
    word: "Dad",
    stage: "birth",
    stageLabel: "Model from birth",
    routine: "People",
    hands: "one",
    shape: "An open 5 hand with the fingers comfortably spread",
    place: "The thumb touches or comes close to the forehead",
    palm: "Palm faces sideways",
    move: "Make one light thumb contact at the forehead. A light double tap is also a common variation.",
    repetitions: "One contact",
    teachingMoment: "When Dad comes into view, say “Dad,” make the sign, and warmly direct your baby’s attention toward him.",
    commonMistake: "Touching the chin, which is the usual location for Mom.",
    checks: componentChecks({
      shape: "My hand is open with five relaxed fingers.",
      palm: "My palm faces to the side rather than toward my face.",
      place: "My thumb reaches my forehead or comes very close to it.",
      move: "I use one light, clear contact."
    }),
    source: lifeprintSource("m/momdad.htm"),
    cue: {
      summary: "Open 5 hand, thumb to forehead",
      frames: [{ shape: "open", label: "Thumb to forehead", motion: "touch-forehead" }]
    },
    careNote: "Use the family name you actually say, and model it without turning recognition into a quiz."
  },
  {
    id: "all-done",
    word: "All done",
    stage: "4-6",
    stageLabel: "Add around 4–6 months",
    routine: "Transitions",
    hands: "two",
    shape: "Both hands open with fingers relaxed and pointing up",
    place: "Neutral space in front of the chest",
    palm: "Begin with palms facing you; finish with palms facing forward",
    move: "Turn both hands outward at the wrists in one short movement.",
    repetitions: "One outward turn",
    teachingMoment: "At the end of a feed, bath, or game, say “all done,” sign, pause, and then finish the activity.",
    commonMistake: "Waving the arms side to side instead of rotating both wrists.",
    checks: componentChecks({
      shape: "Both hands stay open with relaxed fingers.",
      palm: "My palms clearly turn from facing me to facing forward.",
      place: "The sign stays centered in front of my chest.",
      move: "Both wrists twist together without my arms swinging."
    }),
    source: lifeprintSource("f/finish.htm"),
    cue: {
      summary: "Two open palms turn outward",
      frames: [
        { shape: "two-open", label: "Palms in" },
        { shape: "two-open", label: "Turn out", motion: "turn" }
      ]
    },
    careNote: "Respect your baby’s clear stop or refusal cues even when they do not resemble the adult sign."
  },
  {
    id: "more",
    word: "More",
    stage: "4-6",
    stageLabel: "Add around 4–6 months",
    routine: "Feeding & play",
    hands: "two",
    shape: "Both hands form flattened O shapes, with each set of fingertips gathered to its thumb",
    place: "Neutral space in front of the chest",
    palm: "Hands angle inward so the two sets of fingertips face each other",
    move: "Bring the two flattened-O handshapes together until the fingertips make contact.",
    repetitions: "One or two contacts",
    teachingMoment: "Before another bite, song, bounce, or turn, say “more?” sign once, pause, and respond to your baby.",
    commonMistake: "Clapping the whole hands together instead of touching only the gathered fingertips.",
    checks: componentChecks({
      shape: "Both hands hold the same flattened O shape.",
      palm: "The gathered fingertips face each other.",
      place: "My hands meet in front of my chest.",
      move: "Only the gathered fingertips make contact."
    }),
    source: lifeprintSource("m/more.htm"),
    cue: {
      summary: "Two fingertip groups meet",
      frames: [
        { shape: "two-pinch", label: "Fingertips apart" },
        { shape: "two-pinch", label: "Tap together", motion: "tap" }
      ]
    },
    careNote: "Do not withhold food, comfort, or connection until your baby makes the sign."
  },
  {
    id: "up",
    word: "Up",
    stage: "4-6",
    stageLabel: "Add around 4–6 months",
    routine: "Pick-up moments",
    hands: "one",
    shape: "Index finger extended; the other fingers and thumb rest closed",
    place: "Neutral space in front of the upper torso",
    palm: "A comfortable side-facing orientation with the wrist straight",
    move: "Point the index finger upward and move it a short distance higher once.",
    repetitions: "One lift",
    teachingMoment: "Before lifting your baby, ask “up?” make the sign where they can see it, pause, then pick them up.",
    commonMistake: "Circling the finger or repeating it like “upstairs” instead of making one clear upward movement.",
    checks: componentChecks({
      shape: "Only my index finger points upward.",
      palm: "My wrist stays straight in a comfortable side-facing position.",
      place: "My hand begins in front of my upper torso where my baby can see it.",
      move: "My finger travels straight up once."
    }),
    source: lifeprintSource("u/up.htm"),
    cue: {
      summary: "One index finger moves straight up",
      frames: [
        { shape: "point", label: "Point up" },
        { shape: "point", label: "Lift", motion: "up" }
      ]
    },
    careNote: "Lift your baby safely with age-appropriate head and neck support; never pull a baby up by the hands or arms."
  },
  {
    id: "eat",
    word: "Eat",
    stage: "6+",
    stageLabel: "Add around 6+ months",
    routine: "Meals",
    hands: "one",
    shape: "A squished O: fingertips and thumb gathered together",
    place: "Just in front of the closed mouth",
    palm: "Palm faces you",
    move: "Bring the gathered fingertips to the mouth once.",
    repetitions: "One contact",
    teachingMoment: "When your baby is ready for a meal, say “eat,” sign once, pause, and then offer food.",
    commonMistake: "Using two movements by default; the adult verb EAT is normally one movement.",
    checks: componentChecks({
      shape: "All of my fingertips gather to the thumb in a squished O.",
      palm: "My palm faces me.",
      place: "My hand begins close to my closed mouth.",
      move: "My gathered fingertips move to my mouth once."
    }),
    source: lifeprintSource("e/eat.htm"),
    cue: {
      summary: "Gathered fingertips move to the mouth once",
      frames: [
        { shape: "pinch", label: "Gather" },
        { shape: "pinch", label: "To mouth", motion: "to-mouth" }
      ]
    },
    careNote: "The sign does not indicate feeding readiness. Follow your pediatric care team’s guidance and supervise every feed."
  },
  {
    id: "drink",
    word: "Drink",
    stage: "6+",
    stageLabel: "Add around 6+ months",
    routine: "Meals",
    hands: "one",
    shape: "A C hand, as if holding a cup",
    place: "Begin in front of the mouth",
    palm: "Palm faces inward, with the thumb side up",
    move: "Move the C hand to the mouth in one short arc, like tipping a cup.",
    repetitions: "One short arc",
    teachingMoment: "Before offering an age-appropriate cup or drink, say “drink,” sign once, pause, and then offer it.",
    commonMistake: "Moving the hand straight sideways instead of arcing the imaginary cup toward the mouth.",
    checks: componentChecks({
      shape: "My hand keeps a clear C shape.",
      palm: "My palm faces inward and my thumb side stays up.",
      place: "I begin just in front of my mouth.",
      move: "My hand follows one short arc toward my mouth."
    }),
    source: lifeprintSource("d/drink.htm"),
    cue: {
      summary: "C hand tips like a cup",
      frames: [
        { shape: "c", label: "Hold cup" },
        { shape: "c", label: "Tip to mouth", motion: "tilt" }
      ]
    },
    careNote: "Offer only drinks appropriate for your baby’s age and follow your pediatric care team’s feeding guidance."
  },
  {
    id: "help",
    word: "Help",
    stage: "6+",
    stageLabel: "Add around 6+ months",
    routine: "Frustration & play",
    hands: "two",
    shape: "A loose thumb-up A hand rests on the flat palm of the other hand",
    place: "Neutral space near the lower chest",
    palm: "Supporting palm faces up; the top hand’s thumb points up",
    move: "Keep the hands connected and lift them together as one unit.",
    repetitions: "One lift",
    teachingMoment: "As you notice frustration, ask “help?” make the sign, pause briefly, and then help right away.",
    commonMistake: "Lifting only the fist and leaving the supporting hand behind.",
    checks: componentChecks({
      shape: "My loose A hand rests securely on my open, flat hand.",
      palm: "The supporting palm and top thumb both face up.",
      place: "My connected hands begin near my lower chest.",
      move: "Both hands lift together without separating."
    }),
    source: lifeprintSource("h/help.htm"),
    cue: {
      summary: "A hand rests on a flat palm; both lift",
      frames: [
        { shape: "a-on-flat", label: "Stack hands" },
        { shape: "a-on-flat", label: "Lift together", motion: "lift" }
      ]
    },
    careNote: "Never make your baby perform the sign before giving needed help, comfort, or protection."
  },
  {
    id: "hurt",
    word: "Hurt",
    stage: "6+",
    stageLabel: "Add around 6+ months",
    routine: "Comfort",
    hands: "two",
    shape: "Both index fingers extended; all other fingers and thumbs closed",
    place: "In neutral space, or near the body area that hurts",
    palm: "Hands angle so the two index fingertips point toward each other",
    move: "Bring the index fingers toward each other twice with a small jabbing motion.",
    repetitions: "Two small jabs",
    teachingMoment: "While calmly checking discomfort, say “hurt?” model the sign near the area, and keep attending to your baby’s cues.",
    commonMistake: "Making a large motion far from the relevant area or leaving facial expression out of the sign.",
    checks: componentChecks({
      shape: "Only my two index fingers are extended.",
      palm: "The index fingertips aim toward each other.",
      place: "I sign in neutral space or close to the relevant body area.",
      move: "The fingertips make two small movements toward each other."
    }),
    source: lifeprintSource("p/pain.htm"),
    cue: {
      summary: "Two index fingers point toward the sore area",
      frames: [
        { shape: "two-point", label: "Fingertips face" },
        { shape: "two-point", label: "Move together", motion: "jab" }
      ]
    },
    careNote: "This sign cannot diagnose pain. Check your baby promptly and seek urgent medical help whenever symptoms or your instincts warrant it."
  }
];

const handGuides = {
  milk: ["Curve your fingers and thumb as if holding a small cup. Close your fingers into a fist, then relax them again.", "Rest your other hand. Only the signing hand opens and closes."],
  sleep: ["Spread your fingers in front of your face, palm toward you. Lower the hand while gathering your fingertips to your thumb, ending below your chin.", "Rest your other hand. Let your face look sleepy as the hand comes down."],
  diaper: ["At one side of your waist, hold out your thumb, index finger, and middle finger. Fold your ring finger and pinky. Tap the two fingers against the thumb.", "Make the same shape at the other side of your waist. Both hands tap their own thumbs at the same time."],
  mom: ["Spread all five fingers. Lightly touch your thumb to your chin, keeping the fingers pointing up.", "Rest your other hand. Remember: Mom is at the chin."],
  dad: ["Spread all five fingers. Lightly touch your thumb to your forehead, keeping the fingers pointing up.", "Rest your other hand. Remember: Dad is at the forehead."],
  "all-done": ["Open both hands at chest height, fingers pointing up and palms toward you.", "Turn both wrists outward so your palms face away. The wrists turn; your arms do not wave from side to side."],
  more: ["Gather all fingertips to the thumb on each hand, like two little closed beaks.", "Face the gathered fingertips toward each other at chest height. Bring the two groups of fingertips together gently, once or twice."],
  up: ["Fold your other fingers and point your index finger up. Lift the pointing hand a short distance.", "Rest your other hand. This is the general sign for up; pair it with your usual words before picking baby up."],
  eat: ["Gather all four fingertips to your thumb. Bring that group of fingertips to your lips once.", "Rest your other hand. Keep the movement small and your fingertips together."],
  drink: ["Curve your fingers and thumb around an imaginary cup. Bring it to your lips and tip it slightly.", "Rest your other hand. Keep the cup shape as you move."],
  help: ["Make a loose fist with your thumb pointing up. Rest the little-finger side of that fist on your other palm.", "Hold your other hand flat, palm up, under the fist. Lift both hands together, keeping them in contact."],
  hurt: ["Point both index fingers toward each other. Fold your other fingers and thumbs in.", "Move the fingertips toward each other twice with a small motion, near the area that hurts. Use a concerned expression."]
};
const originalGroups = {milk:"Meals",sleep:"Bedtime",diaper:"Care",mom:"Connection",dad:"Connection","all-done":"Meals",more:"Meals",up:"Care",eat:"Meals",drink:"Meals",help:"Connection",hurt:"Connection"};
export const signs = [...signCatalog, ...extraSigns, ...familySigns, ...faithReferences].map(sign => ({
  ...sign,
  group: sign.group || originalGroups[sign.id],
  handGuide: sign.handGuide || handGuides[sign.id],
  demo: media[sign.id] || sign.demo
}));
export const routineGroups = [...new Set(signs.map(sign => sign.group))];

export const stageOrder = [
  { id: "birth", shortLabel: "From birth" },
  { id: "4-6", shortLabel: "4–6 months" },
  { id: "6+", shortLabel: "6+ months" }
];

export default signs;
