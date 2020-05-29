import { Contact } from "../entities/contact"
import { GraphQLClient } from 'graphql-request'
import { extractAddress, extractPhones, extractSocialLinks } from "./funcs";

const getQueryFor = (searchId: string): string => {
  return `
    query getPublicListings_matchmaking {
      company {
        publicAccountantListings(first: 1, filterBy: "searchId='${searchId}'", with: "captchaResponse=''") {
          edges {
            node {
              id
              telephones {
                telephoneType
                number
                extension
              }
              socialLinks {
                name
                url
                __typename
              }
              addresses {
                addressComponents {
                  name
                  value
                }
                geoLocation {
                  latitude
                  longitude
                }
              }
            }
          }
        }
      }
    }`;
}

export class ContactService {

  public getCustomer = async (searchId: string, graphQLClient: GraphQLClient, index: number | null): Promise<Contact> => {

    console.log(` - ${index}) process contact: '${searchId}' ... `)

    try {
      const pageResult = await graphQLClient.request(getQueryFor(searchId), {
        "pluginInfo": {
          "omitCookies": true,
          "allowRequestPartialSuccess": true
        }
      })

      const node = pageResult['company']['publicAccountantListings']['edges'][0]['node']
      const id = node['id']
      const phones = extractPhones(node['telephones'])
      const addresses = extractAddress(node['addresses'])
      const socLinks = extractSocialLinks(node['socialLinks'])
      // console.log('DATA IS ', { phones, addresses });

      const contact = new Contact()
      contact.id = id
      contact.phone = phones.join(',')
      contact.address = addresses
      contact.socialLink = socLinks.join(',')
      return contact
    } catch (err) {
      console.log(`Could not fetch contact: '${searchId}'`, err)
      return null
    }
  }
}