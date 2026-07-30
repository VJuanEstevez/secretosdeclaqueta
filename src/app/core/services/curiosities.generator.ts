import { CURIOSITIES_PER_MOVIE, Curiosity } from '../models/curiosity.model';
import { MovieDetail } from '../models/movie.model';

/**
 * Generador local de respaldo para el modo demo.
 *
 * No inventa anécdotas: compone cinco fichas a partir de los metadatos reales
 * de la película. La interfaz etiqueta siempre este contenido como simulado
 * para que no se confunda con las curiosidades del servicio de IA.
 */
export function generateDemoCuriosities(movie: MovieDetail): Curiosity[] {
  const year = movie.releaseYear ?? 'un año sin registrar';
  const candidates: Curiosity[] = [];

  if (movie.director) {
    candidates.push({
      title: 'Detrás de la cámara',
      body: `${movie.director} figura como director en la ficha de «${movie.title}» (${year}).`,
    });
  }

  if (movie.cast.length) {
    candidates.push({
      title: 'Cabeza de cartel',
      body: `El reparto principal lo encabezan ${movie.cast.slice(0, 3).join(', ')}.`,
    });
  }

  if (movie.runtimeMinutes) {
    const hours = Math.floor(movie.runtimeMinutes / 60);
    const minutes = movie.runtimeMinutes % 60;
    candidates.push({
      title: 'Cuestión de metraje',
      body: `Dura ${movie.runtimeMinutes} minutos, es decir ${hours} h ${minutes.toString().padStart(2, '0')} min de proyección.`,
    });
  }

  if (movie.tagline) {
    candidates.push({
      title: 'El eslogan',
      body: `La campaña se apoyó en la frase: «${movie.tagline}».`,
    });
  }

  if (movie.productionCompanies.length) {
    candidates.push({
      title: 'Quién puso el dinero',
      body: `Figura producida por ${movie.productionCompanies.join(' y ')}.`,
    });
  }

  if (movie.genres.length) {
    candidates.push({
      title: 'Dónde se coloca',
      body: `TMDB la clasifica como ${movie.genres.join(', ').toLocaleLowerCase('es')}.`,
    });
  }

  if (movie.voteCount > 0) {
    candidates.push({
      title: 'El veredicto del público',
      body: `Acumula ${movie.voteCount.toLocaleString('es-ES')} votos con una media de ${movie.rating} sobre 10.`,
    });
  }

  if (movie.originalTitle && movie.originalTitle !== movie.title) {
    candidates.push({
      title: 'Título original',
      body: `En su idioma original se estrenó como «${movie.originalTitle}».`,
    });
  }

  candidates.push({
    title: 'Sinopsis en una línea',
    body: movie.overview || 'TMDB no recoge sinopsis para esta película.',
  });

  return padToExactCount(candidates, movie);
}

/**
 * Garantiza las cinco entradas que exige la interfaz incluso cuando la ficha
 * de TMDB viene casi vacía.
 */
export function padToExactCount(items: readonly Curiosity[], movie: MovieDetail): Curiosity[] {
  const result = items.slice(0, CURIOSITIES_PER_MOVIE);
  let index = result.length;

  while (result.length < CURIOSITIES_PER_MOVIE) {
    index += 1;
    result.push({
      title: `Dato pendiente ${index}`,
      body: `Todavía no hay suficiente información en la ficha de «${movie.title}» para completar este apartado.`,
    });
  }

  return result;
}
