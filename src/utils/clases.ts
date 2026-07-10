export function unirClases(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(" ");
}
