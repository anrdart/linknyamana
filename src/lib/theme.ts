export function getTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
}

export function setTheme(theme: 'light' | 'dark') {
  localStorage.setItem('theme', theme)
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function toggleTheme(): 'light' | 'dark' {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  document.documentElement.classList.add('transitioning')
  setTheme(next)
  setTimeout(() => document.documentElement.classList.remove('transitioning'), 350)
  return next
}
