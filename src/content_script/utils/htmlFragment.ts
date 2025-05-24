export const htmlFragment = (str: string) =>
  document.createRange().createContextualFragment(str).firstElementChild!;
