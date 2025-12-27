--
-- PostgreSQL database dump (DATA ONLY, FIXED)
--

-- Dumped from database version 16.11 (Homebrew)
-- Dumped by pg_dump version 16.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: User; Type: TABLE DATA; Schema: public;
--

INSERT INTO public."User"
(id, name, email, "emailVerified", password, image, role, "createdAt", "updatedAt")
VALUES
('cmi5ob68600008ob1vqzm0km3', 'No Regrets Admin', 'admin@noregrets.bg', NULL, '$2b$10$YMC.cW2DRR6VQekVj5MOEeymdZ8jDPGZZPgTwvKe5eNoL8XGoSBqe', NULL, 'ADMIN', '2025-11-19 07:20:55.11', '2025-11-19 07:20:55.11');


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public;
-- (няма записи)
--



--
-- Data for Name: CakeJar; Type: TABLE DATA; Schema: public;
--

INSERT INTO public."CakeJar"
(id, slug, name, description, layers, image, price, "createdAt", "updatedAt")
VALUES
(
  'cmi5nzu9400038op0gs1up8yi',
  'red-velvet',
  'Торта червено кадифе',
  'Ред Велвет блатове, напоени с ванилов сироп и покрити с нежен крем маскарпоне. Всеки буркан е кадифено сладък и изненадващо лек.',
  '{"Ред Велвет блат","Маскарпоне и сметана"}',
  'red-velvet-cake-jar.png',
  7.00,
  '2025-11-19 07:12:06.367',
  '2025-12-01 17:17:50.289'
),
(
  'cmi5nzu8v00028op0k1e7fx7k',
  'nutella-biscoff',
  'Торта Nutella & Biscoff',
  'Какаови блатове, лек крем, хрупкави парченца Lotus, крем Lotus и Nutella. Комбинация между дълбок шоколад и карамелен хрупкав слой.',
  '{"Шоколадов блат","Nutella","Biscoff крем","Бисквити Lotus","Крем маскарпоне"}',
  'nutella-biscoff-cake-jar.png',
  8.00,
  '2025-11-19 07:12:06.367',
  '2025-12-01 17:17:50.291'
),
(
  'cmi5nzu8v00018op02h0sy8hi',
  'mascarpone-raspberry',
  'Торта с маскарпоне и малина',
  'Въздушен маскарпоне крем, малинов конфитюр и ванилови блатове. Баланс между свежест, малина и копринен крем.',
  '{"Ванилов блат","Малиново сладко","Маскарпоне и сметана"}',
  'mascarpone-raspberry-cake-jar.png',
  7.00,
  '2025-11-19 07:12:06.367',
  '2025-12-01 17:17:50.291'
);


--
-- Data for Name: CookieOption; Type: TABLE DATA; Schema: public;
--

INSERT INTO public."CookieOption"
(id, slug, name, image, "createdAt", "updatedAt", price)
VALUES
('cmi5zgca9002k8ob9ptvpmt1z', 'nutella-bueno', 'Nutella Bueno', 'nutella-bueno-top.png', '2025-11-19 12:32:52.017', '2025-12-01 17:17:50.325', 6.60),
('cmi5zgcab002l8ob9lgvjwvng', 'red-velvet', 'Red Velvet Cheesecake', 'red-velvet-cookie-top.png', '2025-11-19 12:32:52.02', '2025-12-01 17:17:50.326', 6.50),
('cmi5zgcac002m8ob9lhd4j86n', 'biscoff', 'Biscoff', 'biscoff-top.png', '2025-11-19 12:32:52.02', '2025-12-01 17:17:50.327', 6.50),
('cmi5zgcac002n8ob9l9jf7bry', 'tripple-choc', 'Tripple Choc', 'tripple-choc-top.png', '2025-11-19 12:32:52.02', '2025-12-01 17:17:50.327', 6.00),
('cmi5zgcac002o8ob9vx4g4cew', 'new-york', 'New York', 'new-york-top.png', '2025-11-19 12:32:52.021', '2025-12-01 17:17:50.327', 6.00),
('cmi5zgcad002p8ob9cfhivz37', 'oreo', 'Oreo & White Choc', 'oreo-cookie-top.png', '2025-11-19 12:32:52.021', '2025-12-01 17:17:50.328', 6.50);


--
-- Data for Name: Coupon; Type: TABLE DATA; Schema: public;
-- (няма записи)
--



--
-- Data for Name: Order; Type: TABLE DATA; Schema: public;
--

INSERT INTO public."Order"
(id, reference, "customerName", "customerEmail", "customerPhone", "deliveryLabel", items, "totalAmount", status, "paymentUrl", "createdAt", "updatedAt")
VALUES
('cmi4pba2200008o6khhh3r2sn', 'NR-1763478073499', 'asfasf fasf', 'fasf', 'fasf', 'Офис Econt – Абланица',
 '[{"name": "Торта в буркан – Маскарпоне и малина", "price": 5, "quantity": 4}, {"name": "Направи сам кутия от 6 кукита", "price": 42, "quantity": 1}]',
 62.00, 'PENDING', '/checkout/success', '2025-11-18 15:01:13.514', '2025-11-18 15:01:13.522'),

('cmi4q0c6c00008op0zf663kdl', 'NR-1763479242649', 'zdf sgdg', 'fdg', 'gsfg', 'Офис Econt – Абланица',
 '[{"name": "Торта в буркан – Маскарпоне и малина", "price": 5, "quantity": 4}, {"name": "Направи сам кутия от 6 кукита", "price": 42, "quantity": 1}]',
 62.00, 'PENDING', NULL, '2025-11-18 15:20:42.66', '2025-11-18 15:20:42.66'),

('cmi8sf0h300008ohdaaelozwc', 'NR-1763725151266', 'zlatomira miteva', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Абланица',
 '[{"name": "Направи сам кутия от 6 кукита", "price": 39, "quantity": 1}]',
 39.00, 'PENDING', NULL, '2025-11-21 11:39:11.27', '2025-11-21 11:39:11.27'),

('cmi8sj9wl00008oovauy6km98', 'NR-1763725350103', 'zlatomira miteva', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Абланица',
 '[{"name": "Направи сам кутия от 6 кукита", "price": 39, "quantity": 1}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-21 11:42:30.117', '2025-11-21 11:42:30.123'),

('cmi8slx4100008ova6wjwvu2r', 'NR-1763725473490', 'dfg gdf', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Абланица',
 '[{"name": "Направи сам кутия от 6 кукита", "price": 39, "quantity": 1}]',
 39.00, 'PENDING', NULL, '2025-11-21 11:44:33.505', '2025-11-21 11:44:33.505'),

('cmia18y5y00018ovaj099nh39', 'NR-1763800451032', 'sfd dfsd', 'mira.miteva92@gmail.com', 'fsd', 'Офис Econt – Абланица',
 '[{"name": "Направи сам кутия от 6 кукита", "price": 39, "quantity": 1}]',
 39.00, 'PENDING', NULL, '2025-11-22 08:34:11.04', '2025-11-22 08:34:11.04'),

('cmia1a8u300009kj9so7aacin', 'NR-1763800511520', 'csc cs', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив',
 '[{"name": "Направи сам кутия от 6 кукита", "price": 39, "quantity": 1}]',
 39.00, 'PENDING', NULL, '2025-11-22 08:35:11.545', '2025-11-22 08:35:11.545'),

('cmia1d7ue00009kr4ik0usrmp', 'NR-1763800650193', 'x`szc scsac', 'csc', 'scs', 'Офис Econt – Абланица',
 '[{"name": "Направи сам кутия от 6 кукита", "price": 39, "quantity": 1}]',
 39.00, 'PENDING', NULL, '2025-11-22 08:37:30.229', '2025-11-22 08:37:30.229'),

('cmia1dxhm00009kva5azgs8z7', 'NR-1763800683449', 'x`szc scsac', 'csc', 'scs', 'Офис Econt – Абланица',
 '[{"name": "Направи сам кутия от 6 кукита", "price": 39, "quantity": 1}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 08:38:03.467', '2025-11-22 08:38:03.474'),

('cmia1ec9j00019kvag88l9b69', 'NR-1763800702611', 'scas casc', 'casc', 'ccas', 'Офис Econt – Абланица',
 '[{"name": "Направи сам кутия от 6 кукита", "price": 39, "quantity": 1}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 08:38:22.614', '2025-11-22 08:38:22.621'),

('cmia1oh3500009k55fr6inj9m', 'NR-1763801175407', 'sdsad das', 'das', 'dasd', 'Офис Econt – Абланица',
 '[{"name": "Направи сам кутия от 6 кукита", "price": 39, "quantity": 1}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 08:46:15.425', '2025-11-22 08:46:15.433'),

('cmia21wg000009kf3pen7pjuy', 'NR-1763801801842', 'z`c zc', 'cz`', 'cz`', 'Офис Econt – Абланица',
 '[{"name": "Направи сам кутия от 6 кукита", "price": 39, "quantity": 1}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 08:56:41.856', '2025-11-22 08:56:41.865'),

('cmia2b5vb00019kf3vmuenc2x', 'NR-1763802233960', 'dgsdg gsdg', 'dgsdgsdg', 'dsvdfg', 'Офис Econt – Абланица',
 '[{"name": "Направи сам кутия от 6 кукита", "price": 39, "quantity": 1}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 09:03:53.962', '2025-11-22 09:03:53.982'),

('cmia8uo0j00009kpuj03z53f4', 'NR-1763813221645', 'dzf dfs', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Адата',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 12:07:01.648', '2025-11-22 12:07:01.663'),

('cmia8wgpl00019kpuad032tjf', 'NR-1763813305495', 'Mira Miteva', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Арчарица',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 12:08:25.496', '2025-11-22 12:08:25.503'),

('cmia90a9d00009karsuwtp6ky', 'NR-1763813483737', 'mira miteva', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Брезовско шосе',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', NULL, '2025-11-22 12:11:23.76', '2025-11-22 12:11:23.76'),

('cmia94a2x00009kfqfi5mcjpd', 'NR-1763813670124', 'mira miteva', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Брезовско шосе',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', NULL, '2025-11-22 12:14:30.151', '2025-11-22 12:14:30.151'),

('cmia94qmd00019kfqbbwinvwe', 'NR-1763813691585', 'mira miteva', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Беласица',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', NULL, '2025-11-22 12:14:51.588', '2025-11-22 12:14:51.588'),

('cmia98ju500009krpeikwgd2j', 'NR-1763813869409', 'mira miteva', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Беласица',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 12:17:49.421', '2025-11-22 12:17:49.428'),

('cmia9cnot00009ky56hseah2y', 'NR-1763814061010', 'mira miteva', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Автогара Родопи',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 12:21:01.038', '2025-11-22 12:21:01.047'),

('cmia9ndq000009k8kfyi7yu99', 'NR-1763814561316', 'mira miteva', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Автогара Родопи',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 12:29:21.335', '2025-11-22 12:29:21.355'),

('cmia9ys9l00009km78521a5il', 'NR-1763815093375', 'mmm nmn', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Пловдив',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 12:38:13.4', '2025-11-22 12:38:13.419'),

('cmiaafngt00009k01tdnbwpsr', 'NR-1763815880311', 'ммм йий', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Адата',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', NULL, '2025-11-22 12:51:20.332', '2025-11-22 12:51:20.332'),

('cmiaaibqj00009k3et6aglqkz', 'NR-1763816005089', 'иухиу ухиу', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Пловдив',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 12:53:25.099', '2025-11-22 12:53:25.106'),

('cmiaalzt300019k3edl3fdh2t', 'NR-1763816176259', 'Мира Митева', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Автогара Родопи',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 12:56:16.261', '2025-11-22 12:56:16.27'),

('cmiaarfks00009k8uwbzdchqa', 'NR-1763816429953', 'Mira Miteva', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Съдийски',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 13:00:29.979', '2025-11-22 13:00:29.996'),

('cmiab4i6400009kkbmeiuir7q', 'NR-1763817039841', 'гъг ътуъ', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Пловдив',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', NULL, '2025-11-22 13:10:39.866', '2025-11-22 13:10:39.866'),

('cmiabfkkp00009kqyb283k1x5', 'NR-1763817556189', 'Гфефе фефе', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Автогара Родопи',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 13:19:16.201', '2025-11-22 13:19:16.207'),

('cmiabgii600019kqyckvzd02v', 'NR-1763817600171', 'Гфефе фефе', 'mira.miteva92@gmail.com', '0897503672', 'Офис Econt – Пловдив, Автогара Родопи',
 '[{"name": "Направи сам кутия от 3 кукита", "price": 19.5, "quantity": 2}]',
 39.00, 'PENDING', 'https://www.mypos.com/vmp/checkout-test', '2025-11-22 13:20:00.172', '2025-11-22 13:20:00.183');


--
-- Data for Name: OrderAuditLog; Type: TABLE DATA; Schema: public;
-- (в момента няма записи – ОК е да е празна)
--



--
-- Data for Name: ProductCategory; Type: TABLE DATA; Schema: public;
--

INSERT INTO public."ProductCategory"
(id, slug, name, description, "heroImage", "createdAt", "updatedAt")
VALUES
('cmi5ob68k00048ob1uveyj3bu', 'cookies', 'Кукита', 'Ръчно изработени кукита по заявка.', 'cookies-hero.jpg', '2025-11-19 07:20:55.125', '2025-12-01 17:17:50.292'),
('cmi5ob68m00058ob135azcebr', 'cookie-boxes', 'Кутии с кукита', 'Най-поръчваните ни кутии с любимите вкусове No Regrets.', 'cookie-box-hero.jpg', '2025-11-19 07:20:55.126', '2025-12-01 17:17:50.293'),
('cmi5nzu9900048op0txlus4os', 'cake-jars', 'Торти в буркан', 'Торти за всеки повод.', 'cake-jars-hero.jpg', '2025-11-19 07:12:06.382', '2025-12-01 17:17:50.294'),
('cmi5ob68n00078ob1sbzlq6rf', 'mochi', 'Мочи десерти', 'Меки оризови сладки със сезонни вкусове.', 'mochi-hero.jpg', '2025-11-19 07:20:55.128', '2025-12-01 17:17:50.294'),
('cmi5ob68n00068ob11lgl7dcn', 'cakes', 'Торти', 'Торти за всеки повод.', 'cake-jars-hero.jpg', '2025-11-19 07:20:55.127', '2025-11-21 10:42:26.534');


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public;
--

INSERT INTO public."Product"
(id, slug, name, "shortDescription", description, weight, "leadTime", "heroImage", "detailImage", price, status, "categoryId", "createdAt", "updatedAt")
VALUES
('cmi5ob68w000t8ob13y0jwy61', 'custom-box-6', 'Направи сам кутия от 6 кукита', 'Класическата ни кутия с шест вкуса.', 'Създайте мечтаната селекция с шест любими вкуса и доставете радост у дома.', '900 гр.', 'Доставка до 4 работни дни', 'box-six-cookies-open.png', NULL, 39.00, 'PUBLISHED', 'cmi5ob68m00058ob135azcebr', '2025-11-19 07:20:55.137', '2025-12-01 17:17:50.307'),
('cmi5ob68o00098ob1vvhpx7o1', 'best-sellers', 'Best Sellers кутия от 3 кукита', 'Кутия с най-поръчваните ни вкусове.', 'Три емблематични вкуса, селектирани от нас и опаковани в подаръчна кутия – готови за споделяне или сладък жест към любим човек.', '450 гр.', 'Доставка до 4 работни дни', 'best-sellers-cookie-box.png', NULL, 19.60, 'PUBLISHED', 'cmi5ob68m00058ob135azcebr', '2025-11-19 07:20:55.129', '2025-12-01 17:17:50.296'),
('cmi5nzu9z000g8op07hki9m49', 'cake-jar-red-velvet', 'Торта червено кадифе', 'Ред Велвет блатове, напоени с ванилов сироп и покрити с нежен крем маскарпоне. Всеки буркан е кадифено сладък и изненадващо лек.', 'Ред Велвет блатове, напоени с ванилов сироп и покрити с нежен крем маскарпоне. Всеки буркан е кадифено сладък и изненадващо лек.', '220 гр.', 'Доставка до 4 работни дни', 'red-velvet-cake-jar.png', NULL, 7.00, 'PUBLISHED', 'cmi5nzu9900048op0txlus4os', '2025-11-19 07:12:06.408', '2025-12-01 17:17:50.319'),
('cmi5nzu9e00068op0ert9whvi', 'cake-jar-nutella-biscoff', 'Торта Nutella & Biscoff', 'Какаови блатове, лек крем, хрупкави парченца Lotus, крем Lotus и Nutella. Комбинация между дълбок шоколад и карамелен хрупкав слой.', 'Какаови блатове, крем маскарпоне, хрупкави парченца Lotus, крем Lotus и Nutella. Комбинация между дълбок шоколад и карамелен хрупкав слой.', '220 гр.', 'Доставка до 4 работни дни', 'nutella-biscoff-cake-jar.png', NULL, 8.00, 'PUBLISHED', 'cmi5nzu9900048op0txlus4os', '2025-11-19 07:12:06.387', '2025-12-01 17:17:50.321'),
('cmi5ob68z00138ob159sieec6', 'mini-cookies', 'Мини кукита с течен шоколад', 'Дребни кукита със сос от Nutella.', 'Перфектни за споделяне – мини кукита, сервирани с купичка Nutella за потапяне.', '240 гр.', 'Доставка до 4 работни дни', 'mini-cookies-falling.png', NULL, 10.00, 'PUBLISHED', 'cmi5ob68m00058ob135azcebr', '2025-11-19 07:20:55.139', '2025-12-01 17:17:50.31'),
('cmi5ob68u000j8ob1qyn5q4ek', 'custom-box-3', 'Направи сам кутия от 3 кукита', 'Персонализирана кутия с три любими вкуса.', 'Изберете три любими кукита и ги получете в елегантна кутия, готова за подарък.', '450 гр.', 'Доставка до 4 работни дни', 'cooke-box-3-open.png', NULL, 19.60, 'PUBLISHED', 'cmi5ob68m00058ob135azcebr', '2025-11-19 07:20:55.134', '2025-12-01 17:17:50.303'),
('cmi5ob691001d8ob1jpuwmboe', 'custom-box-mochi-4', 'Направи сам кутия от 4 мочи', 'Селекция от четири свежи мочита.', 'Създайте своята кутия с четири ръчно приготвени мочита. Перфектни за подарък или следобедно изкушение.', '4 бр. свежи мочита', 'Доставка до 4 работни дни', 'mochi-hero.jpg', NULL, 20.00, 'PUBLISHED', 'cmi5ob68n00078ob1sbzlq6rf', '2025-11-19 07:20:55.141', '2025-12-01 17:17:50.313'),
('cmi5nzu9w000b8op0fzvrlioq', 'cake-jar-mascarpone-raspberry', 'Торта с маскарпоне и малина', 'Въздушен маскарпоне крем, малинов конфитюр и ванилови блатове. Баланс между свежест, малина и копринен крем.', 'Въздушен маскарпоне крем, малинов конфитюр и ванилови блатове. Баланс между свежест, малина и копринен крем.', '240 гр.', 'Доставка до 4 работни дни', 'mascarpone-raspberry-cake-jar.png', NULL, 7.00, 'PUBLISHED', 'cmi5nzu9900048op0txlus4os', '2025-11-19 07:12:06.404', '2025-12-01 17:17:50.323'),
('cmi5ob693001n8ob13p0dr753', 'custom-box-mochi-9', 'Направи сам кутия от 9 мочи', 'Голяма кутия от девет ръчно приготвени мочита.', 'Максимално удоволствие – девет любими вкуса в една голяма кутия, готова за споделяне.', '9 бр. свежи мочита', 'Доставка до 4 работни дни', 'mochi-hero.jpg', NULL, 45.00, 'PUBLISHED', 'cmi5ob68n00078ob1sbzlq6rf', '2025-11-19 07:20:55.143', '2025-12-01 17:17:50.317');


--
-- Data for Name: ProductCategoryImage; Type: TABLE DATA; Schema: public;
--

INSERT INTO public."ProductCategoryImage"
(id, "productId", url, alt, "position")
VALUES
('cminex1ef000k8oihfqiyfkmd', 'cmi5ob68o00098ob1vvhpx7o1', 'cookie-box-hero.jpg', 'Best Sellers кутия от 3 кукита', 0),
('cminex1en00148oihlrmqnuqj', 'cmi5ob68u000j8ob1qyn5q4ek', 'cookie-box-hero.jpg', 'Направи сам кутия от 3 кукита', 0),
('cminex1er001o8oih7fitzkm4', 'cmi5ob68w000t8ob13y0jwy61', 'cookie-box-hero.jpg', 'Направи сам кутия от 6 кукита', 0),
('cminex1eu001y8oihgbfdbhue', 'cmi5ob68z00138ob159sieec6', 'cookie-box.jpg', 'Мини кукита с течен шоколад', 0),
('cminex1ex00288oih7sezjz11', 'cmi5ob691001d8ob1jpuwmboe', 'mochi-hero.jpg', 'Направи сам кутия от 4 мочи', 0),
('cminex1f0002i8oihu31dm2s7', 'cmi5ob693001n8ob13p0dr753', 'mochi-hero.jpg', 'Направи сам кутия от 9 мочи', 0),
('cminex1f3002q8oih31armoj3', 'cmi5nzu9z000g8op07hki9m49', 'red-velvet-cake-jar.png', 'Торта червено кадифе', 0),
('cminex1f5002y8oih9c27wnmf', 'cmi5nzu9e00068op0ert9whvi', 'nutella-biscoff-cake-jar.png', 'Торта Nutella & Biscoff', 0),
('cminex1f700368oihexmuousm', 'cmi5nzu9w000b8op0fzvrlioq', 'mascarpone-raspberry-cake-jar.png', 'Торта с маскарпоне и малина', 0);


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public;
--

INSERT INTO public."ProductImage"
(id, "productId", url, alt, "position")
VALUES
('cminex1ef000g8oihijihz6hk', 'cmi5ob68o00098ob1vvhpx7o1', 'best-sellers-cookie-box.png', 'Best Sellers кутия от 3 кукита', 0),
('cminex1ef000h8oihdqsfzkl0', 'cmi5ob68o00098ob1vvhpx7o1', 'nutella ig.png', 'Best Sellers кутия от 3 кукита', 1),
('cminex1ef000i8oihk6zx7130', 'cmi5ob68o00098ob1vvhpx7o1', 'biscoff ig.png', 'Best Sellers кутия от 3 кукита', 2),
('cminex1ef000j8oihkpanf90v', 'cmi5ob68o00098ob1vvhpx7o1', 'red velvet ig.png', 'Best Sellers кутия от 3 кукита', 3),
('cminex1en000x8oih6hldr2rs', 'cmi5ob68u000j8ob1qyn5q4ek', 'cooke-box-3-open.png', 'Направи сам кутия от 3 кукита', 0),
('cminex1en000y8oihos2gwozr', 'cmi5ob68u000j8ob1qyn5q4ek', 'red velvet ig.png', 'Направи сам кутия от 3 кукита', 1),
('cminex1en000z8oih3kllbqiw', 'cmi5ob68u000j8ob1qyn5q4ek', 'nutella ig.png', 'Направи сам кутия от 3 кукита', 2),
('cminex1en00108oih8fkhhb7b', 'cmi5ob68u000j8ob1qyn5q4ek', 'biscoff ig.png', 'Направи сам кутия от 3 кукита', 3),
('cminex1en00118oihoyioazrd', 'cmi5ob68u000j8ob1qyn5q4ek', 'oreo ig.png', 'Направи сам кутия от 3 кукита', 4),
('cminex1en00128oihz37197qj', 'cmi5ob68u000j8ob1qyn5q4ek', 'new york ig.png', 'Направи сам кутия от 3 кукита', 5),
('cminex1en00138oihz155g37u', 'cmi5ob68u000j8ob1qyn5q4ek', 'tripple choc ig.png', 'Направи сам кутия от 3 кукита', 6),
('cminex1er001h8oih5awnjlpr', 'cmi5ob68w000t8ob13y0jwy61', 'box-six-cookies-open.png', 'Направи сам кутия от 6 кукита', 0),
('cminex1er001i8oihswve2z3a', 'cmi5ob68w000t8ob13y0jwy61', 'red velvet ig.png', 'Направи сам кутия от 6 кукита', 1),
('cminex1er001j8oihml7ucbnh', 'cmi5ob68w000t8ob13y0jwy61', 'nutella ig.png', 'Направи сам кутия от 6 кукита', 2),
('cminex1er001k8oih8z4l237e', 'cmi5ob68w000t8ob13y0jwy61', 'biscoff ig.png', 'Направи сам кутия от 6 кукита', 3),
('cminex1er001l8oihm8f6w01n', 'cmi5ob68w000t8ob13y0jwy61', 'oreo ig.png', 'Направи сам кутия от 6 кукита', 4),
('cminex1er001m8oihtvyypawy', 'cmi5ob68w000t8ob13y0jwy61', 'new york ig.png', 'Направи сам кутия от 6 кукита', 5),
('cminex1er001n8oihg5536bzl', 'cmi5ob68w000t8ob13y0jwy61', 'tripple choc ig.png', 'Направи сам кутия от 6 кукита', 6),
('cminex1eu001w8oihd1t49tba', 'cmi5ob68z00138ob159sieec6', 'cookie-box.jpg', 'Мини кукита с течен шоколад', 0),
('cminex1eu001x8oih06bw2u25', 'cmi5ob68z00138ob159sieec6', 'mini-cookies-falling.png', 'Мини кукита с течен шоколад', 1),
('cminex1ex00268oihhhb8vb7i', 'cmi5ob691001d8ob1jpuwmboe', 'mochi-hero.jpg', 'Направи сам кутия от 4 мочи', 0),
('cminex1ex00278oih3ml93hep', 'cmi5ob691001d8ob1jpuwmboe', 'dark-choc-mochi.png', 'Направи сам кутия от 4 мочи', 1),
('cminex1f0002g8oihtmyzedzk', 'cmi5ob693001n8ob13p0dr753', 'mochi-hero.jpg', 'Направи сам кутия от 9 мочи', 0),
('cminex1f0002h8oih6wos8ryn', 'cmi5ob693001n8ob13p0dr753', 'white-choc-mochi.png', 'Направи сам кутия от 9 мочи', 1),
('cminex1f3002p8oih4sor3787', 'cmi5nzu9z000g8op07hki9m49', 'red-velvet-cake-jar.png', 'Торта червено кадифе', 0),
('cminex1f5002x8oihkv10ipki', 'cmi5nzu9e00068op0ert9whvi', 'nutella-biscoff-cake-jar.png', 'Торта Nutella & Biscoff', 0),
('cminex1f700358oih68sx2nfn', 'cmi5nzu9w000b8op0fzvrlioq', 'mascarpone-raspberry-cake-jar.png', 'Торта с маскарпоне и малина', 0);


--
-- Data for Name: ProductVariant; Type: TABLE DATA; Schema: public;
--

INSERT INTO public."ProductVariant"
(id, "productId", name, sku, price, "isDefault")
VALUES
('cminex1ef000l8oihof2ugfpm', 'cmi5ob68o00098ob1vvhpx7o1', 'Best Sellers кутия (3 кукита)', NULL, 19.60, true),
('cminex1en00158oihnwyc7osp', 'cmi5ob68u000j8ob1qyn5q4ek', 'Кутия от 3 кукита', NULL, 19.60, true),
('cminex1er001p8oih3gyyba7t', 'cmi5ob68w000t8ob13y0jwy61', 'Кутия от 6 кукита', NULL, 39.00, true),
('cminex1eu001z8oih8n9amu45', 'cmi5ob68z00138ob159sieec6', 'Мини кукита', NULL, 10.00, true),
('cminex1ex00298oihzrk8wjvx', 'cmi5ob691001d8ob1jpuwmboe', 'Кутия от 4 мочи', NULL, 20.00, true),
('cminex1f0002j8oihvkgey61l', 'cmi5ob693001n8ob13p0dr753', 'Кутия от 9 мочи', NULL, 45.00, true),
('cminex1f3002r8oih0ctgsrlp', 'cmi5nzu9z000g8op07hki9m49', 'Торта червено кадифе', NULL, 7.00, true),
('cminex1f5002z8oihua5wsakt', 'cmi5nzu9e00068op0ert9whvi', 'Торта Nutella & Biscoff', NULL, 8.00, true),
('cminex1f700378oihmngnkzmz', 'cmi5nzu9w000b8op0fzvrlioq', 'Торта с маскарпоне и малина', NULL, 7.00, true);


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public;
-- (няма записи)
--


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public;
-- (няма записи)
--


--
-- PostgreSQL data load complete
--
