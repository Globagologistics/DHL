// Vite `?url` imports: the file is emitted as a hashed asset and its URL is returned.
// Used for large local data (map TopoJSON, gazetteer) that is fetched on demand.
declare module '*?url' {
  const url: string;
  export default url;
}
