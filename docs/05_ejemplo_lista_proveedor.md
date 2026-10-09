# Ejemplo real de lista de proveedor (fixture de descubrimiento)

La lista siguiente fue aportada por el usuario como **ejemplo de formato**, no como tarifas vigentes ni datos que deban importarse automáticamente. Se conserva para futuras pruebas del analizador y revisión de UX.

## Texto original (sin correcciones)

```text
Toro tinto 21000 oferta
Toro blanco 18000 oferta  Animana blanco 17500
Arizu 15500 
Nativo 16500 
Parrales 17000 y tinto 18000
Arca de Noé blco 15500
Arca de Noé tinto 17500
Coca 2,5 28000
2 25000
1,5 22500
3 27000 oferta
1,5x6 20000
600ccx12 19000 oferta
Cepita 12000
Monster 15500
Fanta 2,5 22500
Fanta 1,5 x8 17500.      Speed chico 32000
Grande 26000
SIFON Talca  8500 
Soda tapa 6800
Marinaro 8000
Premium 8500
Ice 3lts 6500
Secco 3 7700 oferta efectivo 
Secco 2 ¼ 9400
Secco 1.5 7400
Talca 3 12000
Balbo 14000 
Toro x 6 de 1lt 13500
Salta grande 32000
Chica rubia 35000 negra 35000 efectivo 
Imperial 48000 
Miller 55000
Heineken 65000
Bud 39000
Quilmes chic 39000
Grande 30500 OFERTAAA
Susex 18000
dr lemon 31000 OFERTA!!!!!
New STYLE 23000
Fernet 125000 x6 22500c/u litro
195000 x12 17000 c/u 3/4
125000 x 12, 11500 c/u 1/2
Smirnoff 50000
Agua 2 ¼ 7800
Gancia 1.25lts 8000
Fernando 7000
Cerveza 361 11000 
361 de 1.5L 14000
Petacas 
New Style 15000x12
Tres plumas 24000*12 
Tres plumas 3/4 6500
Sidra 18000
Anana  fizz 18
```

## Qué debería detectar una importación asistida (NO asumirlo como verdad)

- Líneas con múltiples artículos y nombres omitidos en líneas siguientes: `Coca 2,5` seguido de `2`, `1,5`, `3`; `Grande` podría depender de la cerveza anterior.
- Variaciones tipográficas y abreviaturas: `blco`, `2 ¼`, `600cc`, `1.5`, `x8`, `*12`, `OFERTAAA`.
- Precios posiblemente por bulto, por unidad y condiciones especiales de pago (`efectivo`).
- Caso contradictorio: `Fernet 125000 x6 22500c/u litro`: 125.000/6 ≈ 20.833,33, distinto de 22.500 por unidad.
- Precio probablemente truncado: `Anana fizz 18`. Requiere confirmación, nunca inferir $18.000 automáticamente.
- Muchas líneas no indican unidades por paquete: mostrar dato recordado si fue verificado; si no, solicitarlo.
- No modificar stock ni precios de venta al procesar este fixture.
