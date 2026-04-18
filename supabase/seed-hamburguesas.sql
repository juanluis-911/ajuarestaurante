-- ============================================================
-- SEED: Hamburguesas (poblar menú, mesas y órdenes de ejemplo)
-- Ajusta RESTAURANT_SLUG al slug real de tu restaurante
-- ============================================================

DO $$
DECLARE
  v_restaurant_id   uuid;
  v_cat_clasicas    uuid;
  v_cat_especiales  uuid;
  v_cat_papas       uuid;
  v_cat_bebidas     uuid;
  v_cat_postres     uuid;
BEGIN

  -- ── Encuentra el restaurante ──────────────────────────────
  SELECT id INTO v_restaurant_id
  FROM restaurants
  WHERE slug = 'hamburguesas'   -- ← cambia si tu slug es diferente
  LIMIT 1;

  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Restaurante no encontrado. Revisa el slug en este script.';
  END IF;

  -- ── Limpia datos previos del seed (idempotente) ───────────
  DELETE FROM menu_items WHERE restaurant_id = v_restaurant_id;
  DELETE FROM categories  WHERE restaurant_id = v_restaurant_id;
  DELETE FROM restaurant_tables WHERE restaurant_id = v_restaurant_id;

  -- ============================================================
  -- CATEGORÍAS
  -- ============================================================

  INSERT INTO categories (restaurant_id, name, description, sort_order)
  VALUES (v_restaurant_id, 'Hamburguesas Clásicas',
          'Nuestras hamburguesas de siempre, hechas con carne 100% res', 1)
  RETURNING id INTO v_cat_clasicas;

  INSERT INTO categories (restaurant_id, name, description, sort_order)
  VALUES (v_restaurant_id, 'Hamburguesas Especiales',
          'Combinaciones únicas para los más aventureros', 2)
  RETURNING id INTO v_cat_especiales;

  INSERT INTO categories (restaurant_id, name, description, sort_order)
  VALUES (v_restaurant_id, 'Papas y Acompañamientos',
          'El complemento perfecto para tu burger', 3)
  RETURNING id INTO v_cat_papas;

  INSERT INTO categories (restaurant_id, name, description, sort_order)
  VALUES (v_restaurant_id, 'Bebidas',
          'Refrescantes opciones para acompañar tu pedido', 4)
  RETURNING id INTO v_cat_bebidas;

  INSERT INTO categories (restaurant_id, name, description, sort_order)
  VALUES (v_restaurant_id, 'Postres',
          'El toque dulce al final', 5)
  RETURNING id INTO v_cat_postres;

  -- ============================================================
  -- MENÚ — Hamburguesas Clásicas
  -- ============================================================

  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, sort_order) VALUES
    (v_restaurant_id, v_cat_clasicas,
     'Classic Burger', 'Carne 100% res, lechuga, tomate, cebolla y pepinillos',
     89.00, 1),
    (v_restaurant_id, v_cat_clasicas,
     'Cheese Burger', 'Carne 100% res con doble queso americano derretido',
     99.00, 2),
    (v_restaurant_id, v_cat_clasicas,
     'Bacon Burger', 'Tocino crujiente, queso cheddar, lechuga y tomate',
     119.00, 3),
    (v_restaurant_id, v_cat_clasicas,
     'Double Burger', 'Doble carne, doble queso, doble sabor',
     139.00, 4),
    (v_restaurant_id, v_cat_clasicas,
     'Junior Burger', 'Porción chica para los pequeños de la mesa',
     69.00, 5);

  -- ============================================================
  -- MENÚ — Hamburguesas Especiales
  -- ============================================================

  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, sort_order) VALUES
    (v_restaurant_id, v_cat_especiales,
     'BBQ Smokehouse', 'Salsa BBQ ahumada, cebolla crujiente y queso cheddar',
     149.00, 1),
    (v_restaurant_id, v_cat_especiales,
     'Jalapeño Fire', 'Jalapeños frescos, queso pepper jack y salsa picante casera',
     139.00, 2),
    (v_restaurant_id, v_cat_especiales,
     'Mushroom Swiss', 'Champiñones salteados, queso suizo y mayonesa de ajo',
     145.00, 3),
    (v_restaurant_id, v_cat_especiales,
     'Hawaiian Burger', 'Piña asada, queso amarillo y salsa teriyaki',
     135.00, 4),
    (v_restaurant_id, v_cat_especiales,
     'Smash Burger', 'Dos carnes aplastadas, queso americano, salsa especial de la casa',
     155.00, 5),
    (v_restaurant_id, v_cat_especiales,
     'Veggie Burger', 'Medallón de verduras y legumbres, aguacate y pico de gallo',
     119.00, 6);

  -- ============================================================
  -- MENÚ — Papas y Acompañamientos
  -- ============================================================

  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, sort_order) VALUES
    (v_restaurant_id, v_cat_papas,
     'Papas Fritas Chicas', 'Papas a la francesa doradas y crujientes',
     45.00, 1),
    (v_restaurant_id, v_cat_papas,
     'Papas Fritas Grandes', 'Porción grande para compartir',
     65.00, 2),
    (v_restaurant_id, v_cat_papas,
     'Papas Gajo', 'Gajos de papa con piel, sazón especial',
     75.00, 3),
    (v_restaurant_id, v_cat_papas,
     'Papas con Queso', 'Papas fritas bañadas en queso cheddar fundido',
     89.00, 4),
    (v_restaurant_id, v_cat_papas,
     'Papas Cargadas', 'Queso, tocino y crema ácida',
     99.00, 5),
    (v_restaurant_id, v_cat_papas,
     'Aros de Cebolla', '8 piezas de aros crujientes con dip de chipotle',
     79.00, 6),
    (v_restaurant_id, v_cat_papas,
     'Nuggets x6', 'Piezas de pollo empanizadas con salsa a elegir',
     79.00, 7),
    (v_restaurant_id, v_cat_papas,
     'Nuggets x12', 'Piezas de pollo empanizadas con dos salsas a elegir',
     139.00, 8);

  -- ============================================================
  -- MENÚ — Bebidas
  -- ============================================================

  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, sort_order) VALUES
    (v_restaurant_id, v_cat_bebidas,
     'Refresco 355 ml', 'Coca-Cola, Sprite, Fanta o agua mineral',
     35.00, 1),
    (v_restaurant_id, v_cat_bebidas,
     'Refresco 600 ml', 'Coca-Cola, Sprite, Fanta o agua mineral',
     49.00, 2),
    (v_restaurant_id, v_cat_bebidas,
     'Agua Natural 500 ml', 'Agua embotellada natural',
     25.00, 3),
    (v_restaurant_id, v_cat_bebidas,
     'Limonada Natural', 'Limonada fresca exprimida al momento',
     55.00, 4),
    (v_restaurant_id, v_cat_bebidas,
     'Limonada Mineral', 'Limonada con agua mineral y hierbabuena',
     59.00, 5),
    (v_restaurant_id, v_cat_bebidas,
     'Malteada Vainilla', 'Malteada espesa de helado de vainilla',
     89.00, 6),
    (v_restaurant_id, v_cat_bebidas,
     'Malteada Chocolate', 'Malteada espesa de helado de chocolate',
     89.00, 7),
    (v_restaurant_id, v_cat_bebidas,
     'Malteada Fresa', 'Malteada espesa de helado de fresa',
     89.00, 8),
    (v_restaurant_id, v_cat_bebidas,
     'Café Americano', 'Café de grano recién preparado',
     45.00, 9);

  -- ============================================================
  -- MENÚ — Postres
  -- ============================================================

  INSERT INTO menu_items (restaurant_id, category_id, name, description, price, sort_order) VALUES
    (v_restaurant_id, v_cat_postres,
     'Sundae Chocolate', 'Helado de vainilla con jarabe de chocolate',
     55.00, 1),
    (v_restaurant_id, v_cat_postres,
     'Sundae Caramelo', 'Helado de vainilla con jarabe de caramelo y nuez',
     55.00, 2),
    (v_restaurant_id, v_cat_postres,
     'Brownie con Helado', 'Brownie tibio de chocolate con bola de helado de vainilla',
     75.00, 3),
    (v_restaurant_id, v_cat_postres,
     'Dona Glaseada', 'Dona fresca del día con glaseado de azúcar',
     45.00, 4);

  -- ============================================================
  -- MESAS
  -- ============================================================

  INSERT INTO restaurant_tables (restaurant_id, number, capacity, status) VALUES
    (v_restaurant_id, '1',  2, 'available'),
    (v_restaurant_id, '2',  2, 'available'),
    (v_restaurant_id, '3',  4, 'available'),
    (v_restaurant_id, '4',  4, 'available'),
    (v_restaurant_id, '5',  4, 'available'),
    (v_restaurant_id, '6',  4, 'available'),
    (v_restaurant_id, '7',  4, 'available'),
    (v_restaurant_id, '8',  6, 'available'),
    (v_restaurant_id, '9',  6, 'available'),
    (v_restaurant_id, '10', 6, 'available'),
    (v_restaurant_id, 'B1', 8, 'available'),   -- mesa de barra
    (v_restaurant_id, 'B2', 8, 'available');   -- mesa de barra

  RAISE NOTICE 'Seed completado para restaurante %', v_restaurant_id;

END $$;
