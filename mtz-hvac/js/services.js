/* services.js: the Learn more panel for each service card, in English and Spanish (js/mtz.js fills the panel).
   value is the service name the booking form uses, so "Book this service" can pick it. */
window.MTZ_SERVICES = {
  'heating-repair': {
    value: 'Heating Repair',
    en: {
      name: 'Heating Repair',
      desc: 'When your heater blows cold air, keeps shutting off, or won\'t turn on, we find out why. You get the price before we start, and nothing happens without your okay.',
      inc: ['A full check of the furnace to find the cause', 'Your price in writing before any work starts', 'The repair, once you say yes', 'A test run to make sure the heat stays on'],
      signs: ['The heater runs but the air comes out cold', 'It turns on and shuts off over and over', 'You hear banging, squealing, or a burning smell'],
      alt: 'Gas furnace in a garage closet with its front panel off and the burners showing'
    },
    es: {
      name: 'Reparación de calefacción',
      desc: 'Si tu calefacción echa aire frío, se apaga sola o no prende, encontramos la causa. Te damos el precio antes de empezar y no hacemos nada sin tu permiso.',
      inc: ['Revisión completa del calentón para encontrar la falla', 'Tu precio por escrito antes de empezar', 'La reparación, cuando tú digas que sí', 'Una prueba para asegurarnos de que la calefacción no se apague'],
      signs: ['El calentón prende pero echa aire frío', 'Se prende y se apaga una y otra vez', 'Hace golpes, rechinidos o huele a quemado'],
      alt: 'Calentón de gas en un clóset del garaje con la tapa quitada y los quemadores a la vista'
    }
  },
  'furnace-tuneup': {
    value: 'Furnace Tune-Up',
    en: {
      name: 'Furnace Tune-Ups',
      desc: 'A yearly tune-up keeps your furnace safe and helps it start every time on cold nights. We clean it, test it, and tell you about anything that looks worn before it fails.',
      inc: ['Burners cleaned and checked for a steady flame', 'Igniter and flame sensor tested and cleaned', 'Air filter checked and changed if it\'s dirty', 'Carbon monoxide test around the furnace'],
      signs: ['It\'s been more than a year since the last tune-up', 'The heat takes a long time to kick on', 'Your gas bill went up and you use the heat the same'],
      alt: 'Furnace in a tidy garage with a new air filter and a checklist on top'
    },
    es: {
      name: 'Mantenimiento de calentón',
      desc: 'Un mantenimiento al año mantiene tu calentón seguro y ayuda a que prenda bien en las noches frías. Lo limpiamos, lo probamos y te avisamos si algo se ve gastado antes de que falle.',
      inc: ['Quemadores limpios y revisados para una flama pareja', 'Encendedor y sensor de flama probados y limpios', 'Filtro de aire revisado y cambiado si está sucio', 'Medición de monóxido de carbono alrededor del calentón'],
      signs: ['Ya pasó más de un año desde el último mantenimiento', 'La calefacción tarda mucho en prender', 'Tu recibo de gas subió y usas la calefacción igual'],
      alt: 'Calentón en un garaje ordenado con un filtro nuevo y una lista de revisión encima'
    }
  },
  'ac-repair': {
    value: 'AC Repair',
    en: {
      name: 'AC Repair',
      desc: 'If your AC is blowing warm air, won\'t turn on, or is leaking, we track down the cause. You see the price first, and you decide before we do the work.',
      inc: ['A check of the outdoor unit and the indoor coil', 'Refrigerant pressure and electrical tests', 'Your price before any work starts', 'The repair and a test run to confirm it\'s cooling'],
      signs: ['Warm air comes out of the vents', 'The outdoor unit hums but the fan won\'t spin', 'Water or ice around the indoor unit'],
      alt: 'Outdoor AC unit beside a stucco home with its service panel open and gauges hooked up'
    },
    es: {
      name: 'Reparación de A/C',
      desc: 'Si tu aire echa aire caliente, no prende o gotea, encontramos la causa. Primero ves el precio y tú decides antes de que hagamos el trabajo.',
      inc: ['Revisión de la unidad de afuera y del serpentín de adentro', 'Pruebas de presión de refrigerante y de la parte eléctrica', 'Tu precio antes de empezar cualquier trabajo', 'La reparación y una prueba para confirmar que enfría'],
      signs: ['Sale aire caliente por las rejillas', 'La unidad de afuera zumba pero el ventilador no gira', 'Hay agua o hielo alrededor de la unidad de adentro'],
      alt: 'Unidad exterior de aire junto a una casa de estuco con el panel abierto y los manómetros conectados'
    }
  },
  'ac-tuneup': {
    value: 'AC Tune-Up',
    en: {
      name: 'AC Tune-Ups',
      desc: 'A spring tune-up gets your AC ready before the first 100 degree day in Riverside. We clean the outdoor unit and check the parts that usually fail in the heat.',
      inc: ['Outdoor coil rinsed and fins straightened', 'Refrigerant level and pressures checked', 'Capacitor and electrical parts tested', 'Drain line cleared so it doesn\'t back up'],
      signs: ['The AC hasn\'t been checked since last summer', 'It runs all afternoon and the house stays warm', 'Your electric bill jumped in the summer'],
      alt: 'Clean outdoor AC unit in a side yard with a garden hose and a fin comb on the pad'
    },
    es: {
      name: 'Mantenimiento de A/C',
      desc: 'Un mantenimiento en la primavera deja listo tu aire antes del primer día de 100 grados en Riverside. Limpiamos la unidad de afuera y revisamos las piezas que más fallan con el calor.',
      inc: ['Serpentín de afuera lavado y aletas enderezadas', 'Nivel de refrigerante y presiones revisados', 'Capacitor y partes eléctricas probados', 'Línea de drenaje destapada para que no se regrese el agua'],
      signs: ['No lo han revisado desde el verano pasado', 'Prende toda la tarde y la casa sigue caliente', 'Tu recibo de luz subió mucho en el verano'],
      alt: 'Unidad exterior de aire limpia en el patio lateral con una manguera y un peine para aletas'
    }
  },
  'new-system': {
    value: 'New System Install',
    en: {
      name: 'New System Installs',
      desc: 'When an old system keeps breaking down, a new one can cost less over time than more repairs. We size it to your home and give you a written price before any work starts.',
      inc: ['A visit to measure your home and look at your ductwork', 'Options at different prices, explained in plain words', 'Removal of the old equipment', 'Install, permit, and a full test before we leave'],
      signs: ['Your system is 15 years old or more', 'You\'ve paid for repairs two winters in a row', 'Some rooms never get warm or cool enough'],
      alt: 'Two new outdoor HVAC units on a fresh concrete pad beside a two-story stucco home'
    },
    es: {
      name: 'Instalación de equipo nuevo',
      desc: 'Cuando un equipo viejo se descompone seguido, uno nuevo puede salir más barato con el tiempo que seguir reparando. Lo escogemos del tamaño de tu casa y te damos el precio por escrito antes de empezar.',
      inc: ['Una visita para medir tu casa y revisar los ductos', 'Opciones de diferentes precios, explicadas en palabras sencillas', 'Retiro del equipo viejo', 'Instalación, permiso y una prueba completa antes de irnos'],
      signs: ['Tu equipo tiene 15 años o más', 'Pagaste reparaciones dos inviernos seguidos', 'Hay cuartos que nunca se calientan ni se enfrían bien'],
      alt: 'Dos unidades nuevas de HVAC sobre una base de concreto junto a una casa de estuco de dos pisos'
    }
  },
  'thermostat': {
    value: 'Thermostats & Air Quality',
    en: {
      name: 'Thermostats & Air Quality',
      desc: 'A new thermostat and the right filter can fix rooms that stay too hot or too cold and cut down on dust. We install them and show you how to set the schedule.',
      inc: ['Smart or programmable thermostat installed and wired', 'Your schedule set up with you before we leave', 'Filter size checked and a better filter installed', 'A check of the airflow at your vents'],
      signs: ['The thermostat reads one thing and the house feels another', 'Dust builds up fast on furniture', 'Someone at home has allergies that act up indoors'],
      alt: 'Round smart thermostat on a hallway wall with an air purifier in the living room behind it'
    },
    es: {
      name: 'Termostatos y calidad del aire',
      desc: 'Un termostato nuevo y el filtro correcto pueden arreglar cuartos que están muy calientes o muy fríos y ayudan con el polvo. Los instalamos y te enseñamos a programar el horario.',
      inc: ['Termostato inteligente o programable instalado y conectado', 'Tu horario programado contigo antes de irnos', 'Revisión del tamaño del filtro y un filtro mejor instalado', 'Revisión del flujo de aire en las rejillas'],
      signs: ['El termostato marca una cosa y la casa se siente otra', 'Se junta polvo rápido en los muebles', 'Alguien en casa tiene alergias que empeoran adentro'],
      alt: 'Termostato inteligente redondo en la pared del pasillo con un purificador de aire en la sala'
    }
  }
};
