# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — juego en `game.js`, con lógica y dibujo del power-up y la estrella fugaz en archivos separados
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |
| `S`       | Activar escudo |

## Skins de la nave

El selector sobre el juego permite cambiar entre **Clásica**, **Neón**, **Solar** y **Caza** en cualquier momento. Cambian la silueta, los colores del casco y el propulsor, y los iconos de vidas; no modifican velocidad, colisiones ni disparos. La elección se mantiene al reaparecer, avanzar de nivel y reiniciar.

La preferencia se guarda en el navegador cuando el almacenamiento está disponible; si está bloqueado, la selección funciona durante la sesión. Después de usar el selector, pulsa Tab o haz clic en el canvas para volver a pilotar.

## Puntuación

| Asteroide     | Puntos |
| ------------- | ------ |
| Grande        | 20     |
| Mediano       | 50     |
| Pequeño       | 100    |
| Estrella fugaz | 200    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- **Disparo triple:** recoge el círculo rosa con tres puntos para lanzar tres balas en abanico por cada pulsación de Espacio durante 5 segundos: una al frente, otra a 45° a la izquierda y otra a 45° a la derecha. Aparece cada 15–25 segundos y permanece 10 segundos. El contador muestra el tiempo restante; recoger otro renueva el efecto. Morir, cambiar de nivel o reiniciar lo elimina.
- **Escudo:** pulsa S para protegerte de colisiones con asteroides y estrellas fugaces durante 3 segundos. Se puede volver a activar 8 segundos después de la activación anterior; mantener S pulsada no lo reactiva. Un halo azul y el HUD muestran su estado. No destruye enemigos ni da puntos, y permite seguir moviéndose y disparando. Los temporizadores avanzan solo durante el juego activo; morir, reaparecer, cambiar de nivel o reiniciar lo desactiva y lo deja listo. Las pulsaciones durante la muerte o el game over se descartan.
- **Velocidad:** un rayo aparece en una posición aleatoria cada 15–25 segundos y desaparece tras 10 segundos si no se recoge. Al tocarlo, la nave se mueve al doble de velocidad durante 5 segundos, con contador en pantalla. Otro rayo renueva el efecto sin acumularlo; morir, cambiar de nivel o reiniciar lo elimina. Los temporizadores avanzan durante el juego activo.
- **Estrella fugaz:** aparece lejos de la nave cada 12–18 segundos de juego activo (unos 15 segundos), con un máximo de una en pantalla. Se mueve a 250 px/s, envuelve los bordes y desaparece tras 6 segundos, desvaneciéndose con una estela dorada. Destruirla da 200 puntos y no genera fragmentos; su desaparición natural no da puntos. Daña la nave salvo durante la invencibilidad. Su presencia no impide completar el nivel: cambiar de nivel elimina la estrella activa pero conserva el contador de aparición. Durante la reaparición sigue moviéndose y envejeciendo, sin avanzar el contador de nuevas apariciones; reiniciar la partida restablece ambos.

## Verificación

Las pruebas de lógica e integración se ejecutan con Node.js, sin instalar dependencias:

```bash
node --test tests/*.test.js
```

Abre `index.html` para comprobar también la estela dorada, el desvanecimiento y los controles del juego.
