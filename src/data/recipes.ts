export interface Ingredient {
  name: string;
  checked: boolean;
  detectClass: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  prepTime: string;
  servings: number;
  difficulty: string;
  category: string;
  image: string;
  ingredients: Ingredient[];
  steps: string[];
}

export const recipesData: Recipe[] = [
  {
    id: '1',
    title: 'Vegane Apfelmuffins',
    prepTime: '45 Minuten',
    servings: 12,
    difficulty: 'Einfach',
    category: 'Muffins',
    image: '/Apfelmuffins.png',
    ingredients: [
      { name: "Apfel", checked: false, detectClass: "apple" },
      { name: "Mehl", checked: false, detectClass: null },
      { name: "Backpulver", checked: false, detectClass: null },
      { name: "brauner Zucker", checked: false, detectClass: null },
      { name: "Zimt", checked: false, detectClass: null },
      { name: "Salz", checked: false, detectClass: null },
      { name: "Apfelmus", checked: false, detectClass: null },
      { name: "geschmacksneutrales Öl", checked: false, detectClass: "bottle" },
      { name: "Pflanzlicher Drink", checked: false, detectClass: null },
    ],
    steps: [
      "Backofen auf 190 Grad Ober- und Unterhitze vorheizen",
      "Äpfel waschen, halbieren und das Gehäuse entfernen. Anschließend in kleine Würfel schneiden. Optional: Eine der Hälften für die Dekoration der Muffins in feine Scheiben schneiden.",
      "Mehl, Backpulver, brauner Zucker, Zimt und Salz in eine große Schüssel geben und miteinander vermengen.",
      "Apfelmus, Öl und Pflanzendrink dazugeben und mit dem Schneebesen oder Kuchenspatel zu einem klümpchenfreien Teig verrühren. Nicht länger als nötig rühren, da der Teig sonst beim Backen zu fest wird und nicht aufgeht.",
      "Eine Handvoll Apfelstücke aufheben. Die restlichen Apfelstücke unter den Teig heben.",
      "Ein Muffinblech mit Papierförmchen auslegen. Den Teig gleichmäßig auf die Mulden verteilen.",
      "Die übrigen Apfelwürfel auf die Muffins legen und mit einer Prise Zimt bestreuen.",
      "Auf der mittleren Schiene 25 Minuten goldbraun backen. Sie sind fertig, sobald an einem Holzstäbchen, dass du in die Mitte des Teiges steckst, nur noch ganz vereinzelt Krümel hängen bleiben.",
      "Apfelmuffins aus dem Ofen nehmen, aus dem Blech lösen und abkühlen lassen. Luftdicht verpackt und kühl gelagert bleiben sie 2-3 Tage lecker saftig! Lass es dir schmecken!"
    ]
  },
  {
    id: '2',
    title: 'Obstsalat',
    prepTime: '15 Minuten',
    servings: 4,
    difficulty: 'Einfach',
    category: 'Salat',
    image: '/Obstsalat.png',
    ingredients: [
      { name: "Orange", checked: false, detectClass: "orange" },
      { name: "Apfel", checked: false, detectClass: "apple" },
      { name: "Banane", checked: false, detectClass: "banana" }
    ],
    steps: [
      "Den Apfel waschen, entkernen und in Würfel schneiden",
      "Die Orange schälen und in mundgerechte Stücke teilen",
      "Die Banane schälen und in Scheiben schneiden",
      "Alles zusammen in eine Schüssel geben und gleichmäßig vermengen",
      "Pur servieren"
    ]
  },
  {
    id: '3',
    title: 'Apfelkuchen',
    prepTime: '60-70 Min.',
    servings: 8,
    difficulty: 'Mittel',
    category: 'Kuchen',
    image: '/applepie.png',
    ingredients: [
      { name: "Äpfel", checked: false, detectClass: "apple" },
      { name: "Mehl", checked: false, detectClass: null },
      { name: "Zucker", checked: false, detectClass: null },
      { name: "Eier", checked: false, detectClass: null },
      { name: "Öl", checked: false, detectClass: "bottle" },
      { name: "Backpulver", checked: false, detectClass: null },
      { name: "Zimt", checked: false, detectClass: null },
      { name: "Puderzucker", checked: false, detectClass: null }
    ],
    steps: [
      "Ofen auf 180°C Ober-/Unterhitze vorheizen.",
      "Drei Äpfel schälen, entkernen und in dünne Spalten schneiden.",
      "200 Gramm Mehl mit Backpulver und Zimt in einer Schüssel vermischen.",
      "Drei Eier, 100 Gramm Zucker und einen Schuss Öl in einer separaten Schüssel schaumig schlagen.",
      "Mehlmischung unter die Ei-Masse heben, bis ein glatter Teig entsteht.",
      "Apfelspalten vorsichtig unter den Teig heben.",
      "Teig in eine gefettete Springform (26 cm) füllen und glatt streichen.",
      "Kuchen im vorgeheizten Ofen etwa 45-50 Minuten backen.",
      "Stäbchenprobe machen: Holzstäbchen sollte sauber herauskommen.",
      "Kuchen aus dem Ofen nehmen und 10 Minuten in der Form abkühlen lassen.",
      "Kuchen aus der Form lösen und auf einem Kuchengitter vollständig auskühlen lassen.",
      "Mit etwas Puderzucker bestäuben und servieren. Guten Appetit!"
    ]
  },
  {
    id: '4',
    title: 'Spaghetti Carbonara',
    prepTime: '25 Min.',
    servings: 4,
    difficulty: 'Einfach',
    category: 'Pasta',
    image: '/spaghetti.jpg',
    ingredients: [
      { name: "Spaghetti", checked: false, detectClass: null },
      { name: "Eier", checked: false, detectClass: null },
      { name: "Speck", checked: false, detectClass: null },
      { name: "Parmesan", checked: false, detectClass: null },
      { name: "Pfeffer", checked: false, detectClass: null }
    ],
    steps: [
      "Spaghetti in kochendem Salzwasser nach Packungsanweisung al dente kochen.",
      "Speck in kleine Würfel schneiden.",
      "Speck in einer Pfanne knusprig braten.",
      "Eier mit geriebenem Parmesan verquirlen und mit Pfeffer würzen.",
      "Gekochte Spaghetti abgießen, dabei etwas Nudelwasser auffangen.",
      "Spaghetti zum Speck in die Pfanne geben und gut vermischen.",
      "Pfanne vom Herd nehmen und Ei-Mischung unter ständigem Rühren zugeben.",
      "Bei Bedarf mit Nudelwasser verdünnen, bis eine cremige Sauce entsteht.",
      "Sofort servieren mit extra Parmesan und schwarzem Pfeffer."
    ]
  },
  {
    id: '5',
    title: 'Schokoladenkuchen',
    prepTime: '50 Min.',
    servings: 12,
    difficulty: 'Einfach',
    category: 'Kuchen',
    image: '/schokokuchen.jpg',
    ingredients: [
      { name: "Mehl", checked: false, detectClass: null },
      { name: "Kakao", checked: false, detectClass: null },
      { name: "Zucker", checked: false, detectClass: null },
      { name: "Eier", checked: false, detectClass: null },
      { name: "Butter", checked: false, detectClass: null },
      { name: "Milch", checked: false, detectClass: null },
      { name: "Backpulver", checked: false, detectClass: null }
    ],
    steps: [
      "Ofen auf 175°C vorheizen und Backform fetten.",
      "Butter und Zucker schaumig rühren.",
      "Eier einzeln unterrühren.",
      "Mehl, Kakao und Backpulver mischen.",
      "Mehlmischung abwechselnd mit Milch unterrühren.",
      "Teig in die Form füllen und glatt streichen.",
      "35-40 Minuten backen.",
      "Abkühlen lassen und nach Wunsch glasieren."
    ]
  }
];
