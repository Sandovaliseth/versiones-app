// Función utilitaria para combinar clases CSS
// Reemplaza la funcionalidad de clsx sin dependencias externas
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Función para combinar clases con variantes
export const cva = (base: string, variants: Record<string, Record<string, string>>) => {
  return (props: Record<string, string>) => {
    let result = base;
    
    for (const [key, value] of Object.entries(props)) {
      if (variants[key] && variants[key][value]) {
        result += ' ' + variants[key][value];
      }
    }
    
    return result;
  };
};

export default cn;