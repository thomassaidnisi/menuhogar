import { Recipe, WeekPlan, MealPrepTask } from './types';

const createIng = (name: string, amount: number, unit: string, category: 'Verdulería' | 'Carnicería' | 'Lácteos y Huevos' | 'Almacén') => ({
  name,
  amount,
  unit,
  category
});

export const recipesW1: Record<string, Recipe> = {
  milanesas_pure: {
    id: 'w1_milanesas_pure',
    estimatedCalories: 550,
    name: 'Milanesas con Puré de Papa',
    prepTime: 35,
    basePortions: 1,
    ingredients: [
      createIng('Nalgas para Milanesa', 200, 'g', 'Carnicería'),
      createIng('Huevo', 1, 'ud', 'Lácteos y Huevos'),
      createIng('Pan rallado', 100, 'g', 'Almacén'),
      createIng('Papa', 250, 'g', 'Verdulería'),
      createIng('Manteca', 15, 'g', 'Lácteos y Huevos'),
      createIng('Leche', 50, 'ml', 'Lácteos y Huevos'),
    ],
    steps: [
      'Batí los huevos con sal, pimienta, ajo y perejil picado.',
      'Pasá la carne por el huevo y luego por el pan rallado, presionando fuerte.',
      'Herví las papas cortadas en cubos hasta que estén tiernas y hacé el puré con manteca y leche.',
      'Cociná las milanesas al horno con un chorrito de aceite o freilas hasta dorar.'
    ],
    note: 'Podés comprar las milanesas ya empanadas en la carnicería para ahorrar tiempo.'
  },
  sopa_verduras: {
    id: 'w1_sopa_verduras',
    estimatedCalories: 200,
    name: 'Sopa Casera de Verduras',
    prepTime: 25,
    basePortions: 1,
    ingredients: [
      createIng('Zanahoria', 0.5, 'ud', 'Verdulería'),
      createIng('Zapallito', 0.5, 'ud', 'Verdulería'),
      createIng('Calabaza', 100, 'g', 'Verdulería'),
      createIng('Cebolla', 0.5, 'ud', 'Verdulería'),
      createIng('Fideos soperos', 30, 'g', 'Almacén'),
    ],
    steps: [
      'Cortá todas las verduras en cubos pequeños.',
      'Rehogá la cebolla en una olla con aceite, luego agregá las verduras y cubrí con agua.',
      'Herví por 15 minutos e incorporá los fideos soperos hasta que estén cocidos.'
    ]
  },
  pastel_papa: {
    id: 'w1_pastel_papa',
    estimatedCalories: 520,
    name: 'Pastel de Papa Tradicional',
    prepTime: 50,
    basePortions: 1,
    ingredients: [
      createIng('Carne picada', 150, 'g', 'Carnicería'),
      createIng('Cebolla', 1, 'ud', 'Verdulería'),
      createIng('Huevo duro', 0.5, 'ud', 'Lácteos y Huevos'),
      createIng('Papa', 250, 'g', 'Verdulería'),
      createIng('Queso cremoso', 50, 'g', 'Lácteos y Huevos'),
    ],
    steps: [
      'Hacé un puré de papas hirviéndolas peladas en agua con sal.',
      'Salteá cebolla picada con la carne picada y condimentos hasta cocinar.',
      'Armá el pastel en fuente para horno colocando carne abajo, puré arriba y cubriendo con queso cremoso.',
      'Llevá al horno fuerte hasta que esté gratinado.'
    ],
    note: 'El secreto argentino es ponerle una pizca de comino y pimentón a la carne.'
  },
  ensalada_cesar: {
    id: 'w1_ensalada_cesar',
    estimatedCalories: 450,
    name: 'Ensalada César con Pollo',
    prepTime: 20,
    basePortions: 1,
    ingredients: [
      createIng('Pechuga de pollo', 150, 'g', 'Carnicería'),
      createIng('Lechuga romana', 100, 'g', 'Verdulería'),
      createIng('Pan lactal', 1, 'feta', 'Almacén'),
      createIng('Queso parmesano', 20, 'g', 'Lácteos y Huevos'),
      createIng('Mayonesa', 30, 'g', 'Almacén'),
    ],
    steps: [
      'Dorá el pollo salpimentado en tiras a la plancha.',
      'Tostá el pan en cubitos en sartén para hacer los croûtons.',
      'Lavá la lechuga, unila con el pollo, croûtons, mayonesa con limón y parmesano rallado.'
    ]
  },
  tarta_jamon_queso: {
    id: 'w1_tarta_jamon_queso',
    estimatedCalories: 500,
    name: 'Tarta de Jamón y Queso',
    prepTime: 30,
    basePortions: 1,
    ingredients: [
      createIng('Tapa de tarta', 1, 'ud', 'Almacén'),
      createIng('Jamón cocido', 100, 'g', 'Carnicería'),
      createIng('Queso Mozzarella', 150, 'g', 'Lácteos y Huevos'),
      createIng('Huevo', 1, 'ud', 'Lácteos y Huevos'),
    ],
    steps: [
      'Forrá una tartera con la masa de tarta.',
      'Rellená con capas de jamón y queso mozzarella.',
      'Batí el huevo, volcá encima, cerrá los bordes (hacé repulgue) y horneá 20 minutos.'
    ],
    note: 'Podés comprar la masa hecha en el súper o hacerla casera con harina, aceite, agua tibia y sal.'
  },
  fideos_tuco: {
    id: 'w1_fideos_tuco',
    estimatedCalories: 580,
    name: 'Fideos con Tuco Casero',
    prepTime: 25,
    basePortions: 1,
    ingredients: [
      createIng('Fideos tallarines', 100, 'g', 'Almacén'),
      createIng('Puré de tomate', 150, 'g', 'Almacén'),
      createIng('Cebolla', 0.5, 'ud', 'Verdulería'),
      createIng('Carne para estofado', 100, 'g', 'Carnicería'),
    ],
    steps: [
      'Salteá la cebolla picada y la carne en cubos en una olla.',
      'Agregá puré de tomate y laurel, cocinando a fuego lento 20 minutos.',
      'Herví los fideos en agua con sal y servilos bañados con la salsa caliente.'
    ]
  },
  guiso_lentejas: {
    id: 'w1_guiso_lentejas',
    estimatedCalories: 550,
    name: 'Guiso de Lentejas de la Abuela',
    prepTime: 45,
    basePortions: 1,
    ingredients: [
      createIng('Lentejas secas', 80, 'g', 'Almacén'),
      createIng('Cebolla', 0.5, 'ud', 'Verdulería'),
      createIng('Zanahoria', 0.5, 'ud', 'Verdulería'),
      createIng('Panceta', 30, 'g', 'Carnicería'),
      createIng('Papa', 1, 'ud', 'Verdulería'),
      createIng('Puré de tomate', 100, 'g', 'Almacén'),
    ],
    steps: [
      'Dorá la panceta en rodajas en una olla sin agregar aceite.',
      'Sumá cebolla y zanahoria picadas finas y rehogá.',
      'Agregá las lentejas (remojadas), puré de tomate, agua y cociná a fuego lento.',
      'Al final, sumá la papa cortada y cociná hasta que todo esté súper tierno.'
    ],
    note: 'Los guisos quedan mucho mejor si reposan un día entero en la heladera.'
  },
  croquetas_acelga: {
    id: 'w1_croquetas_acelga',
    estimatedCalories: 350,
    name: 'Croquetas de Acelga Horneadas',
    prepTime: 30,
    basePortions: 1,
    ingredients: [
      createIng('Acelga cocida', 150, 'g', 'Verdulería'),
      createIng('Cebolla', 0.5, 'ud', 'Verdulería'),
      createIng('Huevo', 1, 'ud', 'Lácteos y Huevos'),
      createIng('Harina leudante', 50, 'g', 'Almacén'),
    ],
    steps: [
      'Picá la acelga escurrida y mezclala con cebolla salteada.',
      'Sumá el huevo, sal, nuez moscada y harina leudante formando una mezcla.',
      'Armá bolitas en placa aceitada y horneá a fuego fuerte de ambos lados.'
    ]
  },
  suprema_papas_fritas: {
    id: 'w1_suprema_papas_fritas',
    estimatedCalories: 650,
    name: 'Suprema con Papas Fritas',
    prepTime: 30,
    basePortions: 1,
    ingredients: [
      createIng('Pechuga de pollo', 180, 'g', 'Carnicería'),
      createIng('Pan rallado', 100, 'g', 'Almacén'),
      createIng('Papa', 250, 'g', 'Verdulería'),
    ],
    steps: [
      'Empaná la pechuga pasándola por huevo batido y luego por pan rallado.',
      'Cortá las papas en bastones y freilas en aceite bien caliente.',
      'Horneá o freí la suprema de pollo hasta dorar.'
    ]
  },
  pizza_casera: {
    id: 'w1_pizza_casera',
    estimatedCalories: 700,
    name: 'Pizza Casera de Muzzarella',
    prepTime: 40,
    basePortions: 1,
    ingredients: [
      createIng('Harina 000', 150, 'g', 'Almacén'),
      createIng('Levadura fresca', 5, 'g', 'Almacén'),
      createIng('Puré de tomate', 80, 'g', 'Almacén'),
      createIng('Queso Mozzarella', 150, 'g', 'Lácteos y Huevos'),
    ],
    steps: [
      'Amasá la harina, levadura disuelta en agua tibia, sal y dejá levar.',
      'Estirá la masa en una pizzera y horneá 8 minutos con salsa de tomate.',
      'Cubrí con mozzarella rallada y gratiná al horno fuerte.'
    ],
    note: 'Si tenés poco tiempo podés usar una prepizza comprada.'
  }
};

export const recipesW2: Record<string, Recipe> = {
  canelones_acelga: {
    id: 'w2_canelones_acelga',
    estimatedCalories: 520,
    name: 'Canelones de Acelga y Ricota',
    prepTime: 45,
    basePortions: 1,
    ingredients: [
      createIng('Tapas de panqueque', 3, 'ud', 'Almacén'),
      createIng('Acelga cocida', 120, 'g', 'Verdulería'),
      createIng('Ricota fresca', 100, 'g', 'Lácteos y Huevos'),
      createIng('Puré de tomate', 100, 'g', 'Almacén'),
    ],
    steps: [
      'Picá la acelga y mezclala con ricota, sal, pimienta y nuez moscada.',
      'Rellená los panqueques, ponelos en una fuente con salsa de tomate abajo.',
      'Volcá más salsa por encima y horneá a fuego medio 15 minutos.'
    ],
    note: 'Podés comprar los panqueques listos en la fiambrería.'
  },
  revuelto_gramajo: {
    id: 'w2_revuelto_gramajo',
    estimatedCalories: 480,
    name: 'Revuelto Gramajo Porteño',
    prepTime: 20,
    basePortions: 1,
    ingredients: [
      createIng('Papa', 200, 'g', 'Verdulería'),
      createIng('Huevo', 2, 'ud', 'Lácteos y Huevos'),
      createIng('Jamón cocido', 50, 'g', 'Carnicería'),
    ],
    steps: [
      'Cortá las papas en hilos finos (pay) y freilas hasta que estén crujientes.',
      'Salteá el jamón cortado, agregá las papas y los huevos batidos.',
      'Revolvé unos segundos a fuego mínimo para que queden jugosos.'
    ]
  },
  pollo_calabaza: {
    id: 'w2_pollo_calabaza',
    estimatedCalories: 480,
    name: 'Pollo al Horno con Calabaza',
    prepTime: 40,
    basePortions: 1,
    ingredients: [
      createIng('Pata muslo de pollo', 1, 'ud', 'Carnicería'),
      createIng('Calabaza', 250, 'g', 'Verdulería'),
    ],
    steps: [
      'Acomodá el pollo y rodajas gruesas de calabaza en una asadera.',
      'Condimentá con sal, pimienta y un chorrito de aceite.',
      'Horneá a fuego fuerte por 40 minutos hasta dorar.'
    ]
  },
  tortilla_papas: {
    id: 'w2_tortilla_papas',
    estimatedCalories: 450,
    name: 'Tortilla de Papas Española',
    prepTime: 30,
    basePortions: 1,
    ingredients: [
      createIng('Papa', 250, 'g', 'Verdulería'),
      createIng('Cebolla', 1, 'ud', 'Verdulería'),
      createIng('Huevo', 3, 'ud', 'Lácteos y Huevos'),
    ],
    steps: [
      'Herví o freí suavemente rodajas finas de papa y cebolla.',
      'Mezclá con los huevos batidos en un bowl con sal.',
      'Cociná en sartén con un poco de aceite unos 4 minutos por lado.'
    ],
    note: 'El punto ideal es que quede bien jugosa en el centro.'
  },
  noquis_bolognesa: {
    id: 'w2_noquis_bolognesa',
    estimatedCalories: 620,
    name: 'Ñoquis Caseros Bolognesa',
    prepTime: 45,
    basePortions: 1,
    ingredients: [
      createIng('Papa', 250, 'g', 'Verdulería'),
      createIng('Harina 0000', 80, 'g', 'Almacén'),
      createIng('Carne picada', 100, 'g', 'Carnicería'),
      createIng('Puré de tomate', 120, 'g', 'Almacén'),
    ],
    steps: [
      'Hacé puré con las papas, agregá harina y sal armando la masa.',
      'Cortá los ñoquis y dales forma con un tenedor.',
      'Hervilos en abundante agua salada y serví con bolognesa de carne y tomate.'
    ]
  },
  ensalada_atun_arroz: {
    id: 'w2_ensalada_atun_arroz',
    estimatedCalories: 400,
    name: 'Ensalada de Atún y Arroz',
    prepTime: 15,
    basePortions: 1,
    ingredients: [
      createIng('Arroz largo fino', 80, 'g', 'Almacén'),
      createIng('Atún natural', 80, 'g', 'Almacén'),
      createIng('Choclo en grano', 50, 'g', 'Almacén'),
    ],
    steps: [
      'Herví el arroz y dejalo enfriar.',
      'Mezclá con el atún, choclo, sal, pimienta, aceite y mayonesa.'
    ]
  },
  zapallitos_rellenos: {
    id: 'w2_zapallitos_rellenos',
    estimatedCalories: 420,
    name: 'Zapallitos Rellenos de Carne',
    prepTime: 35,
    basePortions: 1,
    ingredients: [
      createIng('Zapallito redondo', 2, 'ud', 'Verdulería'),
      createIng('Carne picada', 100, 'g', 'Carnicería'),
      createIng('Cebolla', 0.5, 'ud', 'Verdulería'),
      createIng('Queso cremoso', 40, 'g', 'Lácteos y Huevos'),
    ],
    steps: [
      'Herví los zapallitos 8 minutos, ahuecalos y guardá la pulpa.',
      'Salteá cebolla con carne picada y la pulpa de zapallito.',
      'Rellená y cubrí con queso para gratinar al horno 10 minutos.'
    ]
  },
  sopa_calabaza: {
    id: 'w2_sopa_calabaza',
    estimatedCalories: 250,
    name: 'Crema de Calabaza Asada',
    prepTime: 25,
    basePortions: 1,
    ingredients: [
      createIng('Calabaza', 300, 'g', 'Verdulería'),
      createIng('Crema de leche', 30, 'ml', 'Lácteos y Huevos'),
    ],
    steps: [
      'Asá rodajas de calabaza al horno para concentrar sabor.',
      'Procesalas en olla caliente sumando un poco de caldo.',
      'Agregá crema de leche, sal, pimienta y nuez moscada.'
    ]
  },
  hamburguesas_caseras: {
    id: 'w2_hamburguesas_caseras',
    estimatedCalories: 650,
    name: 'Hamburguesas Completas',
    prepTime: 20,
    basePortions: 1,
    ingredients: [
      createIng('Carne picada seleccionada', 180, 'g', 'Carnicería'),
      createIng('Pan de hamburguesa', 1, 'ud', 'Almacén'),
      createIng('Tomate', 0.5, 'ud', 'Verdulería'),
    ],
    steps: [
      'Formá el disco de carne con sal y pimienta.',
      'Cociná a la plancha fuerte 4 minutos de cada lado con queso encima.',
      'Serví en pan tostado con rodajas de tomate y lechuga.'
    ]
  },
  empanadas_carne: {
    id: 'w2_empanadas_carne',
    estimatedCalories: 450,
    name: 'Empanadas de Carne Criollas',
    prepTime: 35,
    basePortions: 1,
    ingredients: [
      createIng('Tapas de empanada', 3, 'ud', 'Almacén'),
      createIng('Carne picada de res', 120, 'g', 'Carnicería'),
      createIng('Cebolla', 1.5, 'ud', 'Verdulería'),
    ],
    steps: [
      'Salteá abundante cebolla y agregá la carne picada con comino y pimentón.',
      'Dejá enfriar el relleno para que se asienten los jugos.',
      'Armá las empanadas, hacé repulgue y horneá a fuego máximo 10 minutos.'
    ],
    note: 'El relleno es más sabroso si lo hacés un día antes.'
  }
};

// Simplified seed week 3
export const recipesW3: Record<string, Recipe> = {
  bife_ensalada: {
    id: 'w3_bife_ensalada',
    estimatedCalories: 550,
    name: 'Bife de Chorizo con Ensalada',
    prepTime: 20,
    basePortions: 1,
    ingredients: [
      createIng('Bife de chorizo', 250, 'g', 'Carnicería'),
      createIng('Tomate redondo', 1, 'ud', 'Verdulería'),
      createIng('Lechuga', 50, 'g', 'Verdulería'),
    ],
    steps: [
      'Sellá el bife en plancha bien caliente por ambos lados.',
      'Acompañá con ensalada fresca de tomate y lechuga.'
    ]
  },
  zapallitos_revueltos: {
    id: 'w3_zapallitos_revueltos',
    estimatedCalories: 300,
    name: 'Zapallitos Revueltos con Huevo',
    prepTime: 15,
    basePortions: 1,
    ingredients: [
      createIng('Zapallito redondo', 2, 'ud', 'Verdulería'),
      createIng('Huevo', 2, 'ud', 'Lácteos y Huevos'),
    ],
    steps: [
      'Cortá zapallitos en cubos y saltealos con cebolla picada.',
      'Agregá los huevos batidos revolviendo hasta cuajar.'
    ]
  },
  arroz_pollo: {
    id: 'w3_arroz_pollo',
    estimatedCalories: 480,
    name: 'Arroz con Pollo Casero',
    prepTime: 35,
    basePortions: 1,
    ingredients: [
      createIng('Pollo troceado', 180, 'g', 'Carnicería'),
      createIng('Arroz grano medio', 80, 'g', 'Almacén'),
    ],
    steps: [
      'Dorá el pollo en olla, luego sumá cebolla y arroz.',
      'Agregá caldo caliente y cociná por 15-18 minutos.'
    ]
  },
  sand_milanesa: {
    id: 'w3_sand_milanesa',
    estimatedCalories: 650,
    name: 'Sándwich de Milanesa Completo',
    prepTime: 20,
    basePortions: 1,
    ingredients: [
      createIng('Milanesa cocida', 1, 'ud', 'Carnicería'),
      createIng('Pan francés', 1, 'ud', 'Almacén'),
    ],
    steps: [
      'Armá el sándwich de milanesa caliente con tomate, lechuga y aderezo.'
    ]
  },
  tarta_humita: {
    id: 'w3_tarta_humita',
    estimatedCalories: 430,
    name: 'Tarta de Humita (Choclo)',
    prepTime: 30,
    basePortions: 1,
    ingredients: [
      createIng('Tapa de tarta', 1, 'ud', 'Almacén'),
      createIng('Choclo cremoso', 1, 'lata', 'Almacén'),
    ],
    steps: [
      'Mezclá choclo cremoso con cebolla picada, huevo y condimentos.',
      'Volcá en molde de masa y cociná al horno por 25 minutos.'
    ]
  },
  tallarines_pesto: {
    id: 'w3_tallarines_pesto',
    estimatedCalories: 600,
    name: 'Tallarines con Pesto Casero',
    prepTime: 15,
    basePortions: 1,
    ingredients: [
      createIng('Fideos tallarines', 100, 'g', 'Almacén'),
      createIng('Albahaca fresca', 10, 'g', 'Verdulería'),
    ],
    steps: [
      'Triturá albahaca, ajo, nueces y parmesano con aceite de oliva.',
      'Mezclá con los tallarines recién hervidos.'
    ]
  },
  cazuela_mondongo: {
    id: 'w3_cazuela_mondongo',
    estimatedCalories: 480,
    name: 'Cazuela de Mondongo Criolla',
    prepTime: 60,
    basePortions: 1,
    ingredients: [
      createIng('Mondongo hervido', 200, 'g', 'Carnicería'),
      createIng('Salsa de tomate', 100, 'g', 'Almacén'),
    ],
    steps: [
      'Corta el mondongo tierno en tiras.',
      'Cociná en olla profunda con salsa, verduras y garbanzos.'
    ]
  },
  croquetas_papa: {
    id: 'w3_croquetas_papa',
    estimatedCalories: 380,
    name: 'Croquetas de Papa y Queso',
    prepTime: 25,
    basePortions: 1,
    ingredients: [
      createIng('Puré de papas', 200, 'g', 'Verdulería'),
      createIng('Queso Mozzarella', 50, 'g', 'Lácteos y Huevos'),
    ],
    steps: [
      'Formá bolitas de puré de papas con mozzarella en el centro.',
      'Pasá por huevo, pan rallado y horneá hasta dorar.'
    ]
  },
  bondiola_mostaza: {
    id: 'w3_bondiola_mostaza',
    estimatedCalories: 580,
    name: 'Bondiola a la Mostaza con Puré',
    prepTime: 35,
    basePortions: 1,
    ingredients: [
      createIng('Bondiola de cerdo', 200, 'g', 'Carnicería'),
      createIng('Mostaza clásica', 30, 'g', 'Almacén'),
    ],
    steps: [
      'Sellá la bondiola en rodajas gruesas en sartén.',
      'Bañala con mostaza, miel y cociná hasta espesar. Serví con puré.'
    ]
  },
  tacos_pollo: {
    id: 'w3_tacos_pollo',
    estimatedCalories: 450,
    name: 'Tacos de Pollo y Vegetales',
    prepTime: 20,
    basePortions: 1,
    ingredients: [
      createIng('Pechuga de pollo', 150, 'g', 'Carnicería'),
      createIng('Tortillas de trigo', 2, 'ud', 'Almacén'),
    ],
    steps: [
      'Salteá pollo y morrones en tiras finas.',
      'Serví caliente con tortillas tostadas.'
    ]
  }
};

// Simplified seed week 4
export const recipesW4: Record<string, Recipe> = {
  lasagna_jamon_queso: {
    id: 'w4_lasagna_jamon_queso',
    estimatedCalories: 600,
    name: 'Lasagna de Jamón y Queso',
    prepTime: 35,
    basePortions: 1,
    ingredients: [
      createIng('Masa de lasagna', 3, 'placas', 'Almacén'),
      createIng('Jamón cocido', 100, 'g', 'Carnicería'),
      createIng('Queso Mozzarella', 150, 'g', 'Lácteos y Huevos'),
    ],
    steps: [
      'Armá capas de masa, jamón, queso y salsa en fuente de horno.',
      'Cociná al horno por 20 minutos hasta gratinar.'
    ]
  },
  sopa_tomate: {
    id: 'w4_sopa_tomate',
    estimatedCalories: 200,
    name: 'Sopa de Tomate y Albahaca',
    prepTime: 20,
    basePortions: 1,
    ingredients: [
      createIng('Tomate maduro', 2, 'ud', 'Verdulería'),
      createIng('Puré de tomate', 100, 'g', 'Almacén'),
    ],
    steps: [
      'Herví tomates picados, cebolla y puré de tomate.',
      'Licuá agregando albahaca fresca al final.'
    ]
  },
  pastel_calabaza: {
    id: 'w4_pastel_calabaza',
    estimatedCalories: 480,
    name: 'Pastel de Calabaza y Carne',
    prepTime: 40,
    basePortions: 1,
    ingredients: [
      createIng('Carne picada', 150, 'g', 'Carnicería'),
      createIng('Calabaza', 300, 'g', 'Verdulería'),
    ],
    steps: [
      'Salteá carne picada con cebolla.',
      'Acomodá en fuente con puré de calabaza arriba y gratiná con queso.'
    ]
  },
  ensalada_rusa: {
    id: 'w4_ensalada_rusa',
    estimatedCalories: 430,
    name: 'Ensalada Rusa con Pollo',
    prepTime: 25,
    basePortions: 1,
    ingredients: [
      createIng('Papa', 1.5, 'ud', 'Verdulería'),
      createIng('Zanahoria', 1, 'ud', 'Verdulería'),
      createIng('Mayonesa', 40, 'g', 'Almacén'),
    ],
    steps: [
      'Herví cubitos de papa y zanahoria.',
      'Dejá enfriar, uní con arvejas, mayonesa y tiras de pollo.'
    ]
  },
  guiso_arroz: {
    id: 'w4_guiso_arroz',
    estimatedCalories: 500,
    name: 'Guiso de Arroz Familiar',
    prepTime: 30,
    basePortions: 1,
    ingredients: [
      createIng('Arroz largo fino', 80, 'g', 'Almacén'),
      createIng('Carne de res', 100, 'g', 'Carnicería'),
    ],
    steps: [
      'Dorá cubos de carne, agregá cebolla picada y puré de tomate.',
      'Sumá arroz y caldo, cocinando todo a fuego lento.'
    ]
  },
  tortilla_espinaca: {
    id: 'w4_tortilla_espinaca',
    estimatedCalories: 350,
    name: 'Tortilla de Espinaca Express',
    prepTime: 20,
    basePortions: 1,
    ingredients: [
      createIng('Espinaca limpia', 150, 'g', 'Verdulería'),
      createIng('Huevo', 3, 'ud', 'Lácteos y Huevos'),
    ],
    steps: [
      'Salteá cebolla y espinaca 2 minutos.',
      'Mezclá con huevos batidos y cociná en sartén 3 minutos por lado.'
    ]
  },
  suprema_napolitana: {
    id: 'w4_suprema_napolitana',
    estimatedCalories: 600,
    name: 'Suprema Napolitana con Puré',
    prepTime: 35,
    basePortions: 1,
    ingredients: [
      createIng('Pechuga empanada', 1, 'ud', 'Carnicería'),
      createIng('Queso mozzarella', 80, 'g', 'Lácteos y Huevos'),
    ],
    steps: [
      'Cociná suprema al horno.',
      'Cubrí con salsa, jamón, mozzarella y gratiná.'
    ]
  },
  fideos_manteca: {
    id: 'w4_fideos_manteca',
    estimatedCalories: 550,
    name: 'Fideos con Manteca y Queso',
    prepTime: 12,
    basePortions: 1,
    ingredients: [
      createIng('Fideos mostacholes', 100, 'g', 'Almacén'),
      createIng('Manteca', 20, 'g', 'Lácteos y Huevos'),
    ],
    steps: [
      'Herví los fideos al dente.',
      'Colá y revolvé con manteca y queso rallado abundante.'
    ]
  },
  matambre_pizza: {
    id: 'w4_matambre_pizza',
    estimatedCalories: 550,
    name: 'Matambre a la Pizza',
    prepTime: 40,
    basePortions: 1,
    ingredients: [
      createIng('Matambre precocido', 200, 'g', 'Carnicería'),
      createIng('Queso mozzarella', 100, 'g', 'Lácteos y Huevos'),
    ],
    steps: [
      'Cubrí el matambre con salsa y queso mozzarella.',
      'Horneá a fuego fuerte hasta que dore.'
    ]
  },
  fajitas_carne: {
    id: 'w4_fajitas_carne',
    estimatedCalories: 500,
    name: 'Fajitas de Carne Criollas',
    prepTime: 25,
    basePortions: 1,
    ingredients: [
      createIng('Carne de res', 150, 'g', 'Carnicería'),
      createIng('Rápiditas', 2, 'ud', 'Almacén'),
    ],
    steps: [
      'Salteá tiras de carne con cebolla y morrón.',
      'Armá las fajitas con tortillas calientes.'
    ]
  }
};

export const weeklyPlans: Record<number, WeekPlan> = {
  1: {
    id: 1,
    days: [
      { day: 'Lunes', almuerzo: recipesW1.milanesas_pure, cena: recipesW1.sopa_verduras },
      { day: 'Martes', almuerzo: recipesW1.pastel_papa, cena: recipesW1.ensalada_cesar },
      { day: 'Miércoles', almuerzo: recipesW1.tarta_jamon_queso, cena: recipesW1.fideos_tuco },
      { day: 'Jueves', almuerzo: recipesW1.guiso_lentejas, cena: recipesW1.croquetas_acelga },
      { day: 'Viernes', almuerzo: recipesW1.suprema_papas_fritas, cena: recipesW1.pizza_casera }
    ]
  },
  2: {
    id: 2,
    days: [
      { day: 'Lunes', almuerzo: recipesW2.canelones_acelga, cena: recipesW2.revuelto_gramajo },
      { day: 'Martes', almuerzo: recipesW2.pollo_calabaza, cena: recipesW2.tortilla_papas },
      { day: 'Miércoles', almuerzo: recipesW2.noquis_bolognesa, cena: recipesW2.ensalada_atun_arroz },
      { day: 'Jueves', almuerzo: recipesW2.zapallitos_rellenos, cena: recipesW2.sopa_calabaza },
      { day: 'Viernes', almuerzo: recipesW2.hamburguesas_caseras, cena: recipesW2.empanadas_carne }
    ]
  },
  3: {
    id: 3,
    days: [
      { day: 'Lunes', almuerzo: recipesW3.bife_ensalada, cena: recipesW3.zapallitos_revueltos },
      { day: 'Martes', almuerzo: recipesW3.arroz_pollo, cena: recipesW3.sand_milanesa },
      { day: 'Miércoles', almuerzo: recipesW3.tarta_humita, cena: recipesW3.tallarines_pesto },
      { day: 'Jueves', almuerzo: recipesW3.cazuela_mondongo, cena: recipesW3.croquetas_papa },
      { day: 'Viernes', almuerzo: recipesW3.bondiola_mostaza, cena: recipesW3.tacos_pollo }
    ]
  },
  4: {
    id: 4,
    days: [
      { day: 'Lunes', almuerzo: recipesW4.lasagna_jamon_queso, cena: recipesW4.sopa_tomate },
      { day: 'Martes', almuerzo: recipesW4.pastel_calabaza, cena: recipesW4.ensalada_rusa },
      { day: 'Miércoles', almuerzo: recipesW4.guiso_arroz, cena: recipesW4.tortilla_espinaca },
      { day: 'Jueves', almuerzo: recipesW4.suprema_napolitana, cena: recipesW4.fideos_manteca },
      { day: 'Viernes', almuerzo: recipesW4.matambre_pizza, cena: recipesW4.fajitas_carne }
    ]
  }
};

export const getMealPrepTasks = (weekId: number): MealPrepTask[] => {
  return [
    {
      id: `w${weekId}_mp_n1_1`,
      title: 'Lavar hojas verdes y vegetales',
      description: 'Lavá lechuga, acelga y espinaca; guardalas secas en recipientes con papel absorbente. Duran toda la semana impecables.',
      level: 1,
      checked: false
    },
    {
      id: `w${weekId}_mp_n1_2`,
      title: 'Picar la base de verduras aromáticas',
      description: 'Picá cebollas y morrones para toda la semana. Guardalos herméticos con un hilo de aceite.',
      level: 1,
      checked: false
    },
    {
      id: `w${weekId}_mp_n1_3`,
      title: 'Remojar legumbres o hervir arroz',
      description: 'Si toca guiso o ensalada pesada, dejá remojadas las lentejas o herví el arroz base para ahorrar fuego.',
      level: 1,
      checked: false
    },
    {
      id: `w${weekId}_mp_n2_1`,
      title: 'Hacer puré de papa o calabaza',
      description: 'Herví las papas o calabazas, prepará el puré rústico y guardalo listo. Calentalo en microondas antes de comer.',
      level: 2,
      checked: false
    },
    {
      id: `w${weekId}_mp_n2_2`,
      title: 'Hervir huevos y armar croquetas',
      description: 'Herví 4 huevos (duran 5 días con cáscara). Dejá moldeadas las croquetas listas para hornear.',
      level: 2,
      checked: false
    },
    {
      id: `w${weekId}_mp_n2_3`,
      title: 'Dorar carnes o filetear pollos',
      description: 'Sellá pechugas o cortá carne de guiso. Marinar en frío ahorra tiempo de cocción posterior.',
      level: 2,
      checked: false
    },
    {
      id: `w${weekId}_mp_n3_1`,
      title: 'Cocinar el guiso completo',
      description: 'El guiso de lentejas reposado es mil veces mejor. Cocinalo completo y dejalo listo para calentar.',
      level: 3,
      checked: false
    },
    {
      id: `w${weekId}_mp_n3_2`,
      title: 'Armar el pastel en su fuente',
      description: 'Dejá armado el pastel de papa o de calabaza y carne en su fuente. Solo tendrás que hornearlo 25 min para gratinar.',
      level: 3,
      checked: false
    },
    {
      id: `w${weekId}_mp_n3_3`,
      title: 'Preparar masa y salsas caseras',
      description: 'Hacé la bolognesa o salsa blanca y fraccionala. Podés adelantar bollos de pizza casera al freezer.',
      level: 3,
      checked: false
    }
  ];
};
