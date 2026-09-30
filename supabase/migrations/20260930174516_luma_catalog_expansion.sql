-- Expand the fictional Luma demo catalog without replacing product or variant IDs.
-- Existing prices, cart references, and order snapshots remain unchanged.
-- No personal data, service credentials, or access policies are changed.

with descriptions(slug, description, specifications) as (values
  ('luma-a1', 'Make room for a longer listening session with Luma A1 Wireless Headphones. The over-ear design suits focused desk work, study playlists, and relaxed evenings, while Bluetooth and USB-C connections let you choose how to listen. With up to 40 hours of battery life, they offer a full-size alternative to pocket earbuds. Pair them with a compatible audio device for an everyday setup that keeps your music close.', '{"Style": "Over-ear", "Fit": "Adjustable headband (concept)", "Compatibility": "Bluetooth audio devices; USB-C host dependent", "Listening use": "Personal audio", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb),
  ('luma-buds-pro', 'Keep your listening setup small with Luma Buds Pro. Soft silicone tips and a pocket-sized case suit commutes, walks, and short breaks between meetings. The case brings total listening time to 24 hours and gives both earbuds a convenient place to recharge. Choose them when portability matters more than the larger feel of over-ear headphones, and connect to a compatible Bluetooth phone, tablet, or laptop.', '{"Connection": "Bluetooth (concept)", "Charging": "USB-C case (concept)", "Style": "True wireless earbuds", "Compatibility": "Bluetooth audio devices", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb),
  ('soundcylinder', 'Bring a shared playlist to the desk with SoundCylinder. Its rounded body and 360-degree audio design spread listening around the speaker, making it a natural companion for background music, podcasts, or a relaxed gathering. USB-C charging keeps the power connection familiar. Choose it when you want to listen alongside others rather than through headphones, with a compatible Bluetooth device supplying your audio.', '{"Connection": "Bluetooth (concept)", "Style": "Portable cylindrical speaker", "Listening use": "Shared audio", "Compatibility": "Bluetooth audio devices", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb),
  ('magstand', 'Give your everyday devices a home with MagStand 3-in-1. Separate spaces for a phone, watch, and earbuds keep small accessories organised, while a single USB-C input helps tidy the desk or bedside table. The raised phone position puts notifications within easy view. It suits a compact workspace where loose cables accumulate; charging support depends on compatible devices and the appropriate watch accessory.', '{"Style": "Desktop charging stand", "Phone position": "Raised portrait rest (concept)", "Power source": "External USB-C adapter (concept)", "Compatibility": "Device dependent; compatible watch accessory required", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb),
  ('mechkey-flow', 'Create more room on your desk with MechKey Flow. The compact 75% layout keeps a practical set of keys while leaving space for a mouse and notebook. Wireless and USB-C connections let you switch between a tidy setup and a direct cable connection. Choose it for study notes, longer writing sessions, and everyday computer work, with a compatible computer providing the connection you prefer.', '{"Style": "Compact desktop keyboard", "Charging": "USB-C (concept)", "Compatibility": "Compatible wireless or USB-C computers", "Use": "Typing and everyday computer work", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb),
  ('pro-hub', 'Turn a simple laptop setup into a more connected workspace with Pro Hub USB-C. The compact 7-in-1 design groups everyday accessory connections into one hub, making it convenient to move between a desk and a travel bag. Its USB-C host connection reduces separate adapters around your computer. Check your laptop’s USB-C capabilities before connecting displays or peripherals; supported functions depend on the host device.', '{"Style": "Compact laptop hub", "Use": "Connecting desk peripherals", "Host requirement": "USB-C host; capabilities vary", "Display support": "Host dependent (concept)", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb),
  ('luma-watch-s1', 'Keep everyday information a quick glance away with Luma Watch S1. A colour touchscreen makes its interface easy to explore, while a seven-day battery suits a routine with less frequent charging. The adjustable strap gives it an everyday wearable feel for work, study, or time outdoors. Pair it with a compatible phone for reminders and notifications, without treating its lifestyle features as medical measurements.', '{"Strap": "Adjustable silicone (concept)", "Connection": "Bluetooth phone pairing (concept)", "Compatibility": "Companion-phone support required (concept)", "Features": "Reminders and notifications (concept)", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb)
)
update public.products p
set description = d.description,
-- Existing specification values take precedence, preserving operator edits.
    specifications = d.specifications || p.specifications
from descriptions d
where p.slug = d.slug;

-- Category IDs are resolved by slug; unexpected missing categories fail before insertion.
do $$ begin
  if (select count(*) from public.categories where slug in ('audio', 'desk', 'power', 'wearables')) <> 4 then
    raise exception 'Luma catalog requires audio, desk, power, and wearables categories';
  end if;
end $$;

with catalog(slug, name, category_slug, description, specifications) as (values
  ('pocketcharge-20k', 'PocketCharge 20K', 'power', 'Stay powered between wall sockets with PocketCharge 20K. Its 20,000 mAh capacity, USB-C input and output, and extra USB-A port suit a work bag, travel day, or long study session. A charge indicator makes the remaining battery easy to check. Up to 20 W output supports compatible USB-powered devices; charging speed depends on your phone, accessory, and cable. Keep it nearby for practical top-ups on the move.', '{"Capacity": "20,000 mAh (concept)", "Maximum output": "20 W (concept)", "USB-C ports": "1 input/output", "USB-A ports": "1 output", "Input": "USB-C, up to 18 W (concept)", "Display": "Four-level charge indicator", "Compatibility": "USB-powered phones and accessories; device dependent", "Included": "USB-C cable (concept)", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb),
  ('halo-desk-light', 'Halo Desk Light', 'desk', 'Set the mood for reading or focused work with Halo Desk Light. Three colour temperatures and five brightness levels let you explore a warmer evening glow or clearer task lighting. A pivoting head directs light towards your notebook, keyboard, or book, while touch controls keep adjustments close. USB-C power makes the desk connection straightforward; the lamp needs an external power source and has no internal battery.', '{"Light source": "LED (concept)", "Colour temperatures": "3 settings (concept)", "Brightness": "5 levels (concept)", "Power input": "USB-C, 5 V / 2 A (concept)", "Battery": "None; external power required", "Adjustment": "Pivoting light head", "Controls": "Touch controls (concept)", "Height": "38 cm (concept)", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb),
  ('foldaway-stand', 'FoldAway Laptop Stand', 'desk', 'Raise your laptop and reclaim a little desk space with FoldAway Laptop Stand. Six height positions help you find a comfortable screen position, while an open frame and silicone contact pads support a tidy setup. The folding design packs flat for moving between workspaces. It fits 10–16-inch laptops weighing up to three kilograms; check both dimensions and weight, and pair the raised screen with separate input devices.', '{"Laptop size": "10–16 inches (concept)", "Maximum load": "3 kg (concept)", "Height positions": "6 (concept)", "Material": "Aluminium frame (concept)", "Contact points": "Silicone pads (concept)", "Design": "Foldable with open centre", "Folded size": "25 × 5 × 2 cm (concept)", "Weight": "280 g (concept)", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb),
  ('nanocharge-65w', 'NanoCharge 65W', 'power', 'Carry fewer adapters with NanoCharge 65W. Two USB-C ports and one USB-A port make room for a laptop, phone, or everyday accessory in a compact Type G charger. A single USB-C connection supports up to 65 W, while simultaneous use divides the total power between devices. Choose compatible USB Power Delivery or PPS devices and suitable cables, with their charging requirements determining the available speed.', '{"Maximum total output": "65 W (concept)", "USB-C ports": "2", "USB-A ports": "1", "Single USB-C output": "Up to 65 W (concept)", "Shared output": "65 W total, divided between ports (concept)", "Charging standards": "USB Power Delivery / PPS (concept)", "Plug": "Type G (concept)", "Input rating": "100–240 V AC (concept)", "Cable": "Not included (concept)", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb),
  ('linkcable-usbc', 'LinkCable USB-C', 'power', 'Give your charging setup more reach with LinkCable USB-C. The two-metre braided cable connects USB-C devices across a desk, bedside table, or travel setup. It supports up to 100 W with a compatible charger and device, plus USB 2.0 data transfers for everyday files. Choose it for charging and basic data rather than display connections: the cable does not support video output.', '{"Connectors": "USB-C to USB-C", "Length": "2 m (concept)", "Maximum charging": "100 W with compatible hardware (concept)", "Data standard": "USB 2.0 (concept)", "Data rate": "Up to 480 Mbps (concept)", "Video output": "Not supported", "Jacket": "Braided fabric (concept)", "Power negotiation": "E-marked cable (concept)", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb),
  ('arc-mouse', 'Arc Wireless Mouse', 'desk', 'Keep everyday navigation close with Arc Wireless Mouse. Bluetooth and a 2.4 GHz USB-A receiver offer two ways to connect, while three sensitivity settings help adapt pointer movement to different tasks. The curved body, five-button layout, and scroll wheel suit desk work or a laptop bag. Recharge through USB-C when needed, and choose the connection supported by your Windows or macOS computer.', '{"Connections": "Bluetooth / 2.4 GHz receiver (concept)", "Sensitivity": "800 / 1,200 / 1,600 DPI (concept)", "Buttons": "5 including scroll-wheel click (concept)", "Charging": "USB-C", "Battery": "Up to 30 days (concept)", "Receiver": "USB-A receiver included (concept)", "Compatibility": "Windows / macOS; host dependent (concept)", "Weight": "78 g (concept)", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb),
  ('luma-mini-speaker', 'Luma Mini Speaker', 'audio', 'Take a playlist from the desk to another room with Luma Mini Speaker. The compact body and carry loop make it a portable alternative to SoundCylinder, with Bluetooth supplying your audio and USB-C handling charging. Its 5 W driver and eight-hour battery suit casual personal listening. Playback and volume controls sit on the speaker itself; keep it dry, since the design has no water-resistance rating.', '{"Audio output": "5 W (concept)", "Connection": "Bluetooth 5.3 (concept)", "Battery": "Up to 8 hours (concept)", "Charging": "USB-C, 5 V (concept)", "Controls": "Playback and volume buttons (concept)", "Carry option": "Integrated loop (concept)", "Water resistance": "Not rated", "Dimensions": "8 × 8 × 4 cm (concept)", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb),
  ('luma-fitband', 'Luma FitBand', 'wearables', 'Explore a lighter everyday wearable with Luma FitBand. A small colour display puts steps and activity reminders within a glance, while the adjustable silicone strap keeps the design simple. Up to ten days of battery life reduces frequent charging, with a magnetic USB cable for top-ups. Pair it with Android 10 or later, or iOS 15 or later, for lifestyle tracking rather than medical measurements.', '{"Display": "0.96-inch colour screen (concept)", "Battery": "Up to 10 days (concept)", "Activities": "Step tracking and activity reminders (concept)", "Charging": "Magnetic USB cable (concept)", "Connectivity": "Bluetooth (concept)", "Phone compatibility": "Android 10+ / iOS 15+ (concept)", "Strap": "Adjustable silicone (concept)", "Weight": "24 g (concept)", "Health status": "Lifestyle concept; not a medical device", "Finish": "Prism", "Product status": "Fictional portfolio demo"}'::jsonb)
)
insert into public.products (slug, name, category_id, description, specifications)
select d.slug, d.name, c.id, d.description, d.specifications
from catalog d join public.categories c on c.slug = d.category_slug
on conflict (slug) do update
set name = excluded.name, description = excluded.description,
    category_id = excluded.category_id, specifications = excluded.specifications;

-- Existing variants are intentionally retained, including any operator-adjusted prices.
with prices(slug, price_kobo) as (values
  ('pocketcharge-20k', 5500000),
  ('halo-desk-light', 3800000),
  ('foldaway-stand', 2800000),
  ('nanocharge-65w', 3200000),
  ('linkcable-usbc', 1200000),
  ('arc-mouse', 2600000),
  ('luma-mini-speaker', 4200000),
  ('luma-fitband', 6200000)
)
insert into public.product_variants (product_id, label, price_kobo, currency)
select p.id, 'Prism', d.price_kobo, 'NGN'
from prices d join public.products p on p.slug = d.slug
on conflict (product_id, label) do nothing;

with images(slug, storage_path, alt) as (values
  ('pocketcharge-20k', 'pocketcharge-20k.svg', 'Prism power bank with two charging ports and a charge indicator'),
  ('halo-desk-light', 'halo-desk-light.svg', 'Prism desk lamp with a circular light head and curved upright arm'),
  ('foldaway-stand', 'foldaway-stand.svg', 'Prism folding laptop stand with two raised support rails'),
  ('nanocharge-65w', 'nanocharge-65w.svg', 'Prism compact wall charger with three USB ports and a Type G plug'),
  ('linkcable-usbc', 'linkcable-usbc.svg', 'Coiled Prism braided cable with a USB-C connector at each end'),
  ('arc-mouse', 'arc-mouse.svg', 'Prism wireless mouse with a curved shell and central scroll wheel'),
  ('luma-mini-speaker', 'luma-mini-speaker.svg', 'Prism compact circular speaker with a woven front and carry loop'),
  ('luma-fitband', 'luma-fitband.svg', 'Prism slim activity band with a rectangular colour display and silicone strap')
)
insert into public.product_images (product_id, storage_path, alt, sort_order)
select p.id, d.storage_path, d.alt, 0
from images d join public.products p on p.slug = d.slug
where not exists (
  select 1 from public.product_images i
  where i.product_id = p.id and i.storage_path = d.storage_path
);
