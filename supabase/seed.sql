-- Fictional portfolio catalog. Asset upload is a separate operator step.
insert into public.categories(slug,label,sort_order) values('audio','Audio',1),('desk','Desk',2),('power','Power',3),('wearables','Wearables',4) on conflict(slug) do nothing;
insert into public.products(slug,name,description,category_id,specifications) select x.slug,x.name,x.description,c.id,x.specs::jsonb from (values
('luma-a1','Luma A1 Wireless Headphones','A little quiet. A lot of color. Fictional wireless over-ear headphones.','audio','{"Battery":"Up to 40 hours (demo)","Connection":"Bluetooth / USB-C"}'),
('luma-buds-pro','Luma Buds Pro','Pocket-sized sound for your everyday rhythm. Fictional wireless earbuds.','audio','{"Battery":"Up to 24 hours with case (demo)","Fit":"Soft silicone tips"}'),
('soundcylinder','SoundCylinder','A sculptural wireless speaker for your favorite corner. Fictional demo product.','audio','{"Audio":"360-degree sound (demo)","Charging":"USB-C"}'),
('magstand','MagStand 3-in-1','A tidy home for your everyday devices. Fictional charging stand.','power','{"Devices":"Phone, watch and earbuds (demo)","Input":"USB-C"}'),
('mechkey-flow','MechKey Flow','A colorful mechanical keyboard built for your desk. Fictional demo product.','desk','{"Layout":"75% keyboard","Connection":"Wireless / USB-C"}'),
('pro-hub','Pro Hub USB-C','More room to connect. A fictional compact desktop hub.','desk','{"Ports":"7-in-1 (demo)","Connection":"USB-C"}'),
('luma-watch-s1','Luma Watch S1','A bright little companion for your daily routine. Fictional demo wearable.','wearables','{"Display":"Color touchscreen (demo)","Battery":"Up to 7 days (demo)"}')
) as x(slug,name,description,category,specs) join public.categories c on c.slug=x.category on conflict(slug) do nothing;
insert into public.product_variants(product_id,label,price_kobo) select p.id,'Prism',x.price from(values('luma-a1',14500000),('luma-buds-pro',8500000),('soundcylinder',6500000),('magstand',4500000),('mechkey-flow',11000000),('pro-hub',3500000),('luma-watch-s1',18500000)) as x(slug,price) join public.products p on p.slug=x.slug on conflict(product_id,label) do nothing;
insert into public.product_images(product_id,storage_path,alt) select p.id,p.slug||'.svg',p.name||' — colorful demo illustration' from public.products p where not exists(select 1 from public.product_images i where i.product_id=p.id);
