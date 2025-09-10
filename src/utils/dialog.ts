import { ask, confirm, message, open, save } from '@tauri-apps/plugin-dialog'

export async function myAsk() {
  const answer = await ask('This action cannot be reverted. Are you sure?', {
    title: 'Tauri',
    kind: 'warning'
  })

  console.log(answer)
}

export async function myConfirm() {
  // Creates a confirmation Ok/Cancel dialog
  const confirmation = await confirm('This action cannot be reverted. Are you sure?', {
    title: 'Tauri',
    kind: 'warning'
  })

  console.log(confirmation)
}

export async function myMessage() {
  // Shows message
  await message('File not found', { title: 'Tauri', kind: 'error' })
}

export async function mySave() {
  // Prompt to save a 'My Filter' with extension .png or .jpeg
  const path = await save({
    filters: [
      {
        name: 'My Filter',
        extensions: ['png', 'jpeg']
      }
    ]
  })
  console.log(path)
}

export async function myOpen() {
  const file = await open({
    multiple: false,
    directory: false
  })
  console.log(file)
}
