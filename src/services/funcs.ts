export const extractPhones = (text: any[]): string[] => {
  if (!text) {
    return []
  }
  // console.log('Phones', text)
  return text.map(x => {
    if (x.extension) {
      return `(${x.extension})${x.number}`
    }
    return `${x.number}`
  })
}

export const delay = (ms: number): Promise<any> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const extractEmails = (text: string): string[] => {
  if (!text) {
    return []
  }
  const arr = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)
  if (!arr) {
    return []
  }
  // console.log('Emails', arr)
  return arr
}

export const extractSocialLinks = (text: any[] | null): string[] => {
  return text ? text.map(x => x.url) : []
}

export const extractAddress = (address: any[]): string => {
  if (!address) {
    return ''
  }
  const resultString = address.map(x => !x.addressComponents ? '' : x.addressComponents.map(c => c.value).filter(c => c != 'false' && c != 'true')).join(' ')
  // console.log('Address is', resultString)
  return resultString
}
