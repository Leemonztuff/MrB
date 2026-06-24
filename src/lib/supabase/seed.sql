-- Este script es solo para popular la tabla 'products' con datos de ejemplo.
-- Ejecútalo después de haber ejecutado schema.sql.
-- El schema.sql ya limpia las tablas, por lo que este script puede ejecutarse de forma segura.

INSERT INTO products (name, description, category) VALUES
('DesertStyle Pomada efecto mate 50 grs', 'Pomada efecto mate', 'Hairstyle'),
('Polvo Stardust 10grs', 'Polvo styling efecto mate', 'Hairstyle'),
('OldSchool 100 grs', 'Pomada de fijación media/alta y brillo medio', 'Hairstyle'),
('Liquid Pomade 120 ml', 'Pomada líquida para modelar cabello', 'Hairstyle'),
('Shampoo 2 en 1 para el crecimiento 200 cc', 'Shampoo + acondicionador 2 en 1', 'Hairstyle'),
('OldSchool 50 grs', 'Pomada de fijación media/alta y brillo medio', 'Hairstyle'),
('El Capitán aceite para barba 20 ml', 'Aceite para barba', 'FacialBeard'),
('Kit Premium para Barba N°1', 'Kit completo para barba', 'FacialBeard'),
('OG Dandy After Shave 100 grs', 'After shave tradicional', 'FacialBeard'),
('Caja Exhibidora Mr BLONDE', 'Exhibidor para puntos de venta', 'Merchandising'),
('Crystal gel de afeitar 250 grs', 'Gel de afeitar profesional', 'Professional'),
('Crème à Raser 400 grs', 'Crema de afeitado tradicional', 'Professional'),
('Capa Mr Blonde', 'Capa para barbería confeccionada en tela liviana', 'Merchandising');
