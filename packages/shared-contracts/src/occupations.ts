export interface OccupationOption {
  value: string;
  label: string;
  category: string;
}

/** Stable key for free-text occupation capture. */
export const OTHER_OCCUPATION_VALUE = 'other';

/**
 * Authoritative Ghana-focused occupation catalogue for WILMS registration.
 * Values are stable keys; labels are human-readable. Historical free-text
 * records are preserved as-is when they do not match a catalogue value.
 */
export const GHANA_OCCUPATIONS: OccupationOption[] = [
  // Trading & Market Selling
  { value: 'market_trader', label: 'Market Trader', category: 'Trading & Market Selling' },
  { value: 'market_vendor', label: 'Market Vendor', category: 'Trading & Market Selling' },
  { value: 'stallholder', label: 'Stallholder', category: 'Trading & Market Selling' },
  { value: 'street_vendor', label: 'Street Vendor', category: 'Trading & Market Selling' },
  { value: 'hawker', label: 'Hawker', category: 'Trading & Market Selling' },
  { value: 'itinerant_trader', label: 'Itinerant Trader', category: 'Trading & Market Selling' },
  { value: 'petty_trader', label: 'Petty Trader', category: 'Trading & Market Selling' },
  { value: 'shopkeeper', label: 'Shopkeeper', category: 'Trading & Market Selling' },
  { value: 'shop_salesperson', label: 'Shop Salesperson', category: 'Trading & Market Selling' },
  { value: 'kiosk_operator', label: 'Kiosk Operator', category: 'Trading & Market Selling' },
  { value: 'container_shop_operator', label: 'Container Shop Operator', category: 'Trading & Market Selling' },
  { value: 'tabletop_seller', label: 'Tabletop Seller', category: 'Trading & Market Selling' },
  { value: 'provision_seller', label: 'Provision Seller', category: 'Trading & Market Selling' },
  { value: 'general_goods_seller', label: 'General Goods Seller', category: 'Trading & Market Selling' },
  { value: 'second_hand_clothes_seller', label: 'Second-hand Clothes Seller', category: 'Trading & Market Selling' },
  { value: 'clothing_seller', label: 'Clothing Seller', category: 'Trading & Market Selling' },
  { value: 'shoe_seller', label: 'Shoe Seller', category: 'Trading & Market Selling' },
  { value: 'bag_seller', label: 'Bag Seller', category: 'Trading & Market Selling' },
  { value: 'jewellery_seller', label: 'Jewellery Seller', category: 'Trading & Market Selling' },
  { value: 'bead_seller', label: 'Bead Seller', category: 'Trading & Market Selling' },
  { value: 'cosmetics_seller', label: 'Cosmetics Seller', category: 'Trading & Market Selling' },
  { value: 'perfume_seller', label: 'Perfume Seller', category: 'Trading & Market Selling' },
  { value: 'phone_accessories_seller', label: 'Phone Accessories Seller', category: 'Trading & Market Selling' },
  { value: 'mobile_phone_seller', label: 'Mobile Phone Seller', category: 'Trading & Market Selling' },
  { value: 'airtime_seller', label: 'Airtime Seller', category: 'Trading & Market Selling' },
  { value: 'household_goods_seller', label: 'Household Goods Seller', category: 'Trading & Market Selling' },
  { value: 'plastic_goods_seller', label: 'Plastic Goods Seller', category: 'Trading & Market Selling' },
  { value: 'hardware_seller', label: 'Hardware Seller', category: 'Trading & Market Selling' },
  { value: 'building_materials_seller', label: 'Building Materials Seller', category: 'Trading & Market Selling' },
  { value: 'electrical_goods_seller', label: 'Electrical Goods Seller', category: 'Trading & Market Selling' },

  // Food & Produce Selling
  { value: 'fresh_fish_seller', label: 'Fresh Fish Seller', category: 'Food & Produce Selling' },
  { value: 'fried_fish_seller', label: 'Fried Fish Seller', category: 'Food & Produce Selling' },
  { value: 'smoked_fish_seller', label: 'Smoked Fish Seller', category: 'Food & Produce Selling' },
  { value: 'fish_trader', label: 'Fish Trader', category: 'Food & Produce Selling' },
  { value: 'fishmonger', label: 'Fishmonger', category: 'Food & Produce Selling' },
  { value: 'meat_seller', label: 'Meat Seller', category: 'Food & Produce Selling' },
  { value: 'butcher', label: 'Butcher', category: 'Food & Produce Selling' },
  { value: 'poultry_seller', label: 'Poultry Seller', category: 'Food & Produce Selling' },
  { value: 'egg_seller', label: 'Egg Seller', category: 'Food & Produce Selling' },
  { value: 'bread_seller', label: 'Bread Seller', category: 'Food & Produce Selling' },
  { value: 'cake_seller', label: 'Cake Seller', category: 'Food & Produce Selling' },
  { value: 'bofrot_seller', label: 'Bofrot Seller', category: 'Food & Produce Selling' },
  { value: 'doughnut_seller', label: 'Doughnut Seller', category: 'Food & Produce Selling' },
  { value: 'waakye_seller', label: 'Waakye Seller', category: 'Food & Produce Selling' },
  { value: 'cooked_food_seller', label: 'Cooked Food Seller', category: 'Food & Produce Selling' },
  { value: 'food_vendor', label: 'Food Vendor', category: 'Food & Produce Selling' },
  { value: 'street_food_seller', label: 'Street Food Seller', category: 'Food & Produce Selling' },
  { value: 'fruit_seller', label: 'Fruit Seller', category: 'Food & Produce Selling' },
  { value: 'vegetable_seller', label: 'Vegetable Seller', category: 'Food & Produce Selling' },
  { value: 'tomato_seller', label: 'Tomato Seller', category: 'Food & Produce Selling' },
  { value: 'pepper_seller', label: 'Pepper Seller', category: 'Food & Produce Selling' },
  { value: 'onion_seller', label: 'Onion Seller', category: 'Food & Produce Selling' },
  { value: 'plantain_seller', label: 'Plantain Seller', category: 'Food & Produce Selling' },
  { value: 'yam_seller', label: 'Yam Seller', category: 'Food & Produce Selling' },
  { value: 'cassava_seller', label: 'Cassava Seller', category: 'Food & Produce Selling' },
  { value: 'potato_seller', label: 'Potato Seller', category: 'Food & Produce Selling' },
  { value: 'cocoyam_seller', label: 'Cocoyam Seller', category: 'Food & Produce Selling' },
  { value: 'maize_seller', label: 'Maize Seller', category: 'Food & Produce Selling' },
  { value: 'groundnut_seller', label: 'Groundnut Seller', category: 'Food & Produce Selling' },
  { value: 'beans_seller', label: 'Beans Seller', category: 'Food & Produce Selling' },
  { value: 'rice_seller', label: 'Rice Seller', category: 'Food & Produce Selling' },
  { value: 'sachet_water_seller', label: 'Sachet Water Seller', category: 'Food & Produce Selling' },
  { value: 'bottled_water_seller', label: 'Bottled Water Seller', category: 'Food & Produce Selling' },
  { value: 'ice_water_seller', label: 'Ice Water Seller', category: 'Food & Produce Selling' },
  { value: 'drinks_seller', label: 'Drinks Seller', category: 'Food & Produce Selling' },
  { value: 'ice_cream_seller', label: 'Ice Cream Seller', category: 'Food & Produce Selling' },
  { value: 'yoghurt_seller', label: 'Yoghurt Seller', category: 'Food & Produce Selling' },
  { value: 'sobolo_seller', label: 'Sobolo Seller', category: 'Food & Produce Selling' },
  { value: 'palm_oil_seller', label: 'Palm Oil Seller', category: 'Food & Produce Selling' },
  { value: 'coconut_seller', label: 'Coconut Seller', category: 'Food & Produce Selling' },
  { value: 'shea_butter_seller', label: 'Shea Butter Seller', category: 'Food & Produce Selling' },
  { value: 'shito_seller', label: 'Shito Seller', category: 'Food & Produce Selling' },
  { value: 'spice_seller', label: 'Spice Seller', category: 'Food & Produce Selling' },

  // Agriculture & Fishery
  { value: 'farmer', label: 'Farmer', category: 'Agriculture & Fishery' },
  { value: 'crop_farmer', label: 'Crop Farmer', category: 'Agriculture & Fishery' },
  { value: 'vegetable_farmer', label: 'Vegetable Farmer', category: 'Agriculture & Fishery' },
  { value: 'maize_farmer', label: 'Maize Farmer', category: 'Agriculture & Fishery' },
  { value: 'cassava_farmer', label: 'Cassava Farmer', category: 'Agriculture & Fishery' },
  { value: 'plantain_farmer', label: 'Plantain Farmer', category: 'Agriculture & Fishery' },
  { value: 'yam_farmer', label: 'Yam Farmer', category: 'Agriculture & Fishery' },
  { value: 'cocoa_farmer', label: 'Cocoa Farmer', category: 'Agriculture & Fishery' },
  { value: 'oil_palm_farmer', label: 'Oil Palm Farmer', category: 'Agriculture & Fishery' },
  { value: 'fruit_farmer', label: 'Fruit Farmer', category: 'Agriculture & Fishery' },
  { value: 'poultry_farmer', label: 'Poultry Farmer', category: 'Agriculture & Fishery' },
  { value: 'poultry_keeper', label: 'Poultry Keeper', category: 'Agriculture & Fishery' },
  { value: 'livestock_farmer', label: 'Livestock Farmer', category: 'Agriculture & Fishery' },
  { value: 'goat_farmer', label: 'Goat Farmer', category: 'Agriculture & Fishery' },
  { value: 'sheep_farmer', label: 'Sheep Farmer', category: 'Agriculture & Fishery' },
  { value: 'pig_farmer', label: 'Pig Farmer', category: 'Agriculture & Fishery' },
  { value: 'cattle_farmer', label: 'Cattle Farmer', category: 'Agriculture & Fishery' },
  { value: 'fish_farmer', label: 'Fish Farmer', category: 'Agriculture & Fishery' },
  { value: 'aquaculture_worker', label: 'Aquaculture Worker', category: 'Agriculture & Fishery' },
  { value: 'fisher', label: 'Fisher', category: 'Agriculture & Fishery' },
  { value: 'fisherwoman', label: 'Fisherwoman', category: 'Agriculture & Fishery' },
  { value: 'fish_processor', label: 'Fish Processor', category: 'Agriculture & Fishery' },
  { value: 'fish_smoker', label: 'Fish Smoker', category: 'Agriculture & Fishery' },
  { value: 'farm_labourer', label: 'Farm Labourer', category: 'Agriculture & Fishery' },
  { value: 'agricultural_worker', label: 'Agricultural Worker', category: 'Agriculture & Fishery' },
  { value: 'food_crop_farmer', label: 'Food Crop Farmer', category: 'Agriculture & Fishery' },
  { value: 'mixed_crop_farmer', label: 'Mixed Crop Farmer', category: 'Agriculture & Fishery' },
  { value: 'mixed_crop_livestock_farmer', label: 'Mixed Crop & Livestock Farmer', category: 'Agriculture & Fishery' },

  // Clothing & Fashion
  { value: 'seamstress', label: 'Seamstress', category: 'Clothing & Fashion' },
  { value: 'tailor', label: 'Tailor', category: 'Clothing & Fashion' },
  { value: 'dressmaker', label: 'Dressmaker', category: 'Clothing & Fashion' },
  { value: 'fashion_designer', label: 'Fashion Designer', category: 'Clothing & Fashion' },
  { value: 'kente_weaver', label: 'Kente Weaver', category: 'Clothing & Fashion' },
  { value: 'weaver', label: 'Weaver', category: 'Clothing & Fashion' },
  { value: 'cloth_seller', label: 'Cloth Seller', category: 'Clothing & Fashion' },
  { value: 'batik_maker', label: 'Batik Maker', category: 'Clothing & Fashion' },
  { value: 'tie_dye_maker', label: 'Tie-Dye Maker', category: 'Clothing & Fashion' },
  { value: 'embroidery_worker', label: 'Embroidery Worker', category: 'Clothing & Fashion' },
  { value: 'shoe_maker', label: 'Shoe Maker', category: 'Clothing & Fashion' },
  { value: 'shoe_repairer', label: 'Shoe Repairer', category: 'Clothing & Fashion' },
  { value: 'leatherworker', label: 'Leatherworker', category: 'Clothing & Fashion' },
  { value: 'bag_maker', label: 'Bag Maker', category: 'Clothing & Fashion' },
  { value: 'bead_maker', label: 'Bead Maker', category: 'Clothing & Fashion' },

  // Hair & Beauty
  { value: 'hairdresser', label: 'Hairdresser', category: 'Hair & Beauty' },
  { value: 'barber', label: 'Barber', category: 'Hair & Beauty' },
  { value: 'beautician', label: 'Beautician', category: 'Hair & Beauty' },
  { value: 'makeup_artist', label: 'Makeup Artist', category: 'Hair & Beauty' },
  { value: 'nail_technician', label: 'Nail Technician', category: 'Hair & Beauty' },
  { value: 'manicurist', label: 'Manicurist', category: 'Hair & Beauty' },
  { value: 'pedicurist', label: 'Pedicurist', category: 'Hair & Beauty' },
  { value: 'hair_braider', label: 'Hair Braider', category: 'Hair & Beauty' },
  { value: 'wig_maker', label: 'Wig Maker', category: 'Hair & Beauty' },
  { value: 'wig_seller', label: 'Wig Seller', category: 'Hair & Beauty' },

  // Food Preparation & Hospitality
  { value: 'chop_bar_operator', label: 'Chop Bar Operator', category: 'Food Preparation & Hospitality' },
  { value: 'caterer', label: 'Caterer', category: 'Food Preparation & Hospitality' },
  { value: 'cook', label: 'Cook', category: 'Food Preparation & Hospitality' },
  { value: 'baker', label: 'Baker', category: 'Food Preparation & Hospitality' },
  { value: 'pastry_maker', label: 'Pastry Maker', category: 'Food Preparation & Hospitality' },
  { value: 'restaurant_operator', label: 'Restaurant Operator', category: 'Food Preparation & Hospitality' },
  { value: 'drinking_spot_operator', label: 'Drinking Spot Operator', category: 'Food Preparation & Hospitality' },
  { value: 'snack_seller', label: 'Snack Seller', category: 'Food Preparation & Hospitality' },
  { value: 'beverage_seller', label: 'Beverage Seller', category: 'Food Preparation & Hospitality' },
  { value: 'juice_seller', label: 'Juice Seller', category: 'Food Preparation & Hospitality' },
  { value: 'local_drinks_producer', label: 'Local Drinks Producer', category: 'Food Preparation & Hospitality' },
  { value: 'local_drinks_seller', label: 'Local Drinks Seller', category: 'Food Preparation & Hospitality' },
  { value: 'waitress', label: 'Waitress', category: 'Food Preparation & Hospitality' },
  { value: 'waiter', label: 'Waiter', category: 'Food Preparation & Hospitality' },

  // Artisans & Skilled Trades
  { value: 'carpenter', label: 'Carpenter', category: 'Artisans & Skilled Trades' },
  { value: 'mason', label: 'Mason', category: 'Artisans & Skilled Trades' },
  { value: 'welder', label: 'Welder', category: 'Artisans & Skilled Trades' },
  { value: 'metal_fabricator', label: 'Metal Fabricator', category: 'Artisans & Skilled Trades' },
  { value: 'electrician', label: 'Electrician', category: 'Artisans & Skilled Trades' },
  { value: 'plumber', label: 'Plumber', category: 'Artisans & Skilled Trades' },
  { value: 'painter', label: 'Painter', category: 'Artisans & Skilled Trades' },
  { value: 'tiler', label: 'Tiler', category: 'Artisans & Skilled Trades' },
  { value: 'plasterer', label: 'Plasterer', category: 'Artisans & Skilled Trades' },
  { value: 'bricklayer', label: 'Bricklayer', category: 'Artisans & Skilled Trades' },
  { value: 'steel_bender', label: 'Steel Bender', category: 'Artisans & Skilled Trades' },
  { value: 'furniture_maker', label: 'Furniture Maker', category: 'Artisans & Skilled Trades' },
  { value: 'furniture_repairer', label: 'Furniture Repairer', category: 'Artisans & Skilled Trades' },
  { value: 'aluminium_fabricator', label: 'Aluminium Fabricator', category: 'Artisans & Skilled Trades' },
  { value: 'glazier', label: 'Glazier', category: 'Artisans & Skilled Trades' },
  { value: 'roofer', label: 'Roofer', category: 'Artisans & Skilled Trades' },
  { value: 'pop_installer', label: 'POP Installer', category: 'Artisans & Skilled Trades' },
  { value: 'ceiling_installer', label: 'Ceiling Installer', category: 'Artisans & Skilled Trades' },
  { value: 'building_contractor', label: 'Building Contractor', category: 'Artisans & Skilled Trades' },
  { value: 'electronics_repairer', label: 'Electronics Repairer', category: 'Artisans & Skilled Trades' },
  { value: 'radio_tv_repairer', label: 'Radio/TV Repairer', category: 'Artisans & Skilled Trades' },
  { value: 'phone_repairer', label: 'Phone Repairer', category: 'Artisans & Skilled Trades' },
  { value: 'appliance_repairer', label: 'Appliance Repairer', category: 'Artisans & Skilled Trades' },
  { value: 'refrigerator_technician', label: 'Refrigerator Technician', category: 'Artisans & Skilled Trades' },
  { value: 'air_conditioner_technician', label: 'Air Conditioner Technician', category: 'Artisans & Skilled Trades' },

  // Automotive & Transport
  { value: 'auto_mechanic', label: 'Auto Mechanic', category: 'Automotive & Transport' },
  { value: 'motorbike_mechanic', label: 'Motorbike Mechanic', category: 'Automotive & Transport' },
  { value: 'bicycle_repairer', label: 'Bicycle Repairer', category: 'Automotive & Transport' },
  { value: 'boat_mechanic', label: 'Boat Mechanic', category: 'Automotive & Transport' },
  { value: 'vulcaniser', label: 'Vulcaniser', category: 'Automotive & Transport' },
  { value: 'auto_electrician', label: 'Auto Electrician', category: 'Automotive & Transport' },
  { value: 'car_sprayer', label: 'Car Sprayer', category: 'Automotive & Transport' },
  { value: 'auto_body_repairer', label: 'Auto Body Repairer', category: 'Automotive & Transport' },
  { value: 'car_washer', label: 'Car Washer', category: 'Automotive & Transport' },
  { value: 'vehicle_detailer', label: 'Vehicle Detailer', category: 'Automotive & Transport' },
  { value: 'driver', label: 'Driver', category: 'Automotive & Transport' },
  { value: 'taxi_driver', label: 'Taxi Driver', category: 'Automotive & Transport' },
  { value: 'trotro_driver', label: 'Trotro Driver', category: 'Automotive & Transport' },
  { value: 'commercial_driver', label: 'Commercial Driver', category: 'Automotive & Transport' },
  { value: 'delivery_rider', label: 'Delivery Rider', category: 'Automotive & Transport' },
  { value: 'motorbike_rider', label: 'Motorbike Rider', category: 'Automotive & Transport' },
  { value: 'tricycle_operator', label: 'Tricycle Operator', category: 'Automotive & Transport' },
  { value: 'transport_operator', label: 'Transport Operator', category: 'Automotive & Transport' },
  { value: 'porter_kayayei', label: 'Porter / Kayayei', category: 'Automotive & Transport' },

  // Personal & Domestic Services
  { value: 'cleaner', label: 'Cleaner', category: 'Personal & Domestic Services' },
  { value: 'laundry_worker', label: 'Laundry Worker', category: 'Personal & Domestic Services' },
  { value: 'ironing_service', label: 'Ironing Service', category: 'Personal & Domestic Services' },
  { value: 'househelp', label: 'Househelp', category: 'Personal & Domestic Services' },
  { value: 'babysitter', label: 'Babysitter', category: 'Personal & Domestic Services' },
  { value: 'childcare_worker', label: 'Childcare Worker', category: 'Personal & Domestic Services' },
  { value: 'domestic_worker', label: 'Domestic Worker', category: 'Personal & Domestic Services' },
  { value: 'caregiver', label: 'Caregiver', category: 'Personal & Domestic Services' },
  { value: 'event_decorator', label: 'Event Decorator', category: 'Personal & Domestic Services' },
  { value: 'florist', label: 'Florist', category: 'Personal & Domestic Services' },
  { value: 'gardener', label: 'Gardener', category: 'Personal & Domestic Services' },
  { value: 'landscaper', label: 'Landscaper', category: 'Personal & Domestic Services' },

  // Processing & Small Manufacturing
  { value: 'soap_maker', label: 'Soap Maker', category: 'Processing & Small Manufacturing' },
  { value: 'liquid_soap_maker', label: 'Liquid Soap Maker', category: 'Processing & Small Manufacturing' },
  { value: 'shea_butter_processor', label: 'Shea Butter Processor', category: 'Processing & Small Manufacturing' },
  { value: 'palm_oil_processor', label: 'Palm Oil Processor', category: 'Processing & Small Manufacturing' },
  { value: 'coconut_oil_processor', label: 'Coconut Oil Processor', category: 'Processing & Small Manufacturing' },
  { value: 'food_processor', label: 'Food Processor', category: 'Processing & Small Manufacturing' },
  { value: 'garri_processor', label: 'Garri Processor', category: 'Processing & Small Manufacturing' },
  { value: 'cassava_processor', label: 'Cassava Processor', category: 'Processing & Small Manufacturing' },
  { value: 'grain_processor', label: 'Grain Processor', category: 'Processing & Small Manufacturing' },
  { value: 'local_beverage_producer', label: 'Local Beverage Producer', category: 'Processing & Small Manufacturing' },
  { value: 'basket_maker', label: 'Basket Maker', category: 'Processing & Small Manufacturing' },
  { value: 'mat_maker', label: 'Mat Maker', category: 'Processing & Small Manufacturing' },
  { value: 'potter', label: 'Potter', category: 'Processing & Small Manufacturing' },
  { value: 'ceramic_maker', label: 'Ceramic Maker', category: 'Processing & Small Manufacturing' },
  { value: 'block_maker', label: 'Block Maker', category: 'Processing & Small Manufacturing' },
  { value: 'sachet_water_producer', label: 'Sachet Water Producer', category: 'Processing & Small Manufacturing' },

  // Digital & Modern Small Businesses
  { value: 'mobile_money_vendor', label: 'Mobile Money Vendor', category: 'Digital & Modern Small Businesses' },
  { value: 'mobile_money_agent', label: 'Mobile Money Agent', category: 'Digital & Modern Small Businesses' },
  { value: 'online_seller', label: 'Online Seller', category: 'Digital & Modern Small Businesses' },
  { value: 'online_trader', label: 'Online Trader', category: 'Digital & Modern Small Businesses' },
  { value: 'social_media_seller', label: 'Social Media Seller', category: 'Digital & Modern Small Businesses' },
  { value: 'freelancer', label: 'Freelancer', category: 'Digital & Modern Small Businesses' },
  { value: 'graphic_designer', label: 'Graphic Designer', category: 'Digital & Modern Small Businesses' },
  { value: 'photographer', label: 'Photographer', category: 'Digital & Modern Small Businesses' },
  { value: 'videographer', label: 'Videographer', category: 'Digital & Modern Small Businesses' },
  { value: 'printing_services', label: 'Printing Services', category: 'Digital & Modern Small Businesses' },
  { value: 'typist_computer_services', label: 'Typist / Computer Services', category: 'Digital & Modern Small Businesses' },
  { value: 'cyber_cafe_operator', label: 'Cyber Café Operator', category: 'Digital & Modern Small Businesses' },

  // General / Other
  { value: 'artisan', label: 'Artisan', category: 'General / Other' },
  { value: 'apprentice', label: 'Apprentice', category: 'General / Other' },
  { value: 'casual_worker', label: 'Casual Worker', category: 'General / Other' },
  { value: 'labourer', label: 'Labourer', category: 'General / Other' },
  { value: 'self_employed_worker', label: 'Self-employed Worker', category: 'General / Other' },
  { value: 'service_provider', label: 'Service Provider', category: 'General / Other' },
  { value: 'other_informal_worker', label: 'Other Informal Worker', category: 'General / Other' },
  {
    value: OTHER_OCCUPATION_VALUE,
    label: 'Other — Specify',
    category: 'General / Other',
  },
];

const OCCUPATION_BY_VALUE = new Map(GHANA_OCCUPATIONS.map((item) => [item.value, item]));

export function findOccupation(value: string | null | undefined): OccupationOption | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  return OCCUPATION_BY_VALUE.get(value.trim());
}

export function isKnownOccupationValue(value: string | null | undefined): boolean {
  return Boolean(findOccupation(value));
}

/** Human-readable label; preserves legacy free-text values unchanged. */
export function resolveOccupationLabel(
  typeOfWork: string | null | undefined,
  typeOfWorkOther?: string | null,
): string {
  const trimmed = typeOfWork?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  if (trimmed === OTHER_OCCUPATION_VALUE || trimmed === 'Other') {
    const custom = typeOfWorkOther?.trim();
    return custom || 'Other — Specify';
  }

  return findOccupation(trimmed)?.label ?? trimmed;
}

export function filterOccupations(query: string, limit = 40): OccupationOption[] {
  const normalised = query.trim().toLowerCase();
  if (!normalised) {
    return GHANA_OCCUPATIONS.slice(0, limit);
  }

  const scored = GHANA_OCCUPATIONS.map((occupation) => {
    const label = occupation.label.toLowerCase();
    const category = occupation.category.toLowerCase();
    let score = 0;
    if (label === normalised) score = 100;
    else if (label.startsWith(normalised)) score = 90;
    else if (label.includes(normalised)) score = 75;
    else if (occupation.value.includes(normalised.replace(/\s+/g, '_'))) score = 60;
    else if (category.includes(normalised)) score = 40;
    return { occupation, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.occupation.label.localeCompare(right.occupation.label));

  return scored.slice(0, limit).map((entry) => entry.occupation);
}

export const BUSINESS_PREMISES_NUMBER_MAX_LENGTH = 30;
export const BUSINESS_ADDRESS_MAX_LENGTH = 30;
export const BUSINESS_NAME_MAX_LENGTH = 120;
export const OCCUPATION_OTHER_MAX_LENGTH = 80;
