export function resolveMock(data, delay = 250) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), delay)
  })
}

export function rejectMock(message = 'Something went wrong', delay = 250) {
  return new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error(message)), delay)
  })
}
