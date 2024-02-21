import fs from 'fs'

export function removeFile(filePath: string): Promise<void> {
  // delete a file asynchronously
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
