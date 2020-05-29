import { GraphQLClient } from 'graphql-request'
import "reflect-metadata"
import { createConnection, ConnectionOptions, Repository } from "typeorm"
import { Contact } from "./entities/contact";
import { root } from './path'
import { ContactService } from "./services/contactService";
import { extractEmails, extractAddress, delay } from "./services/funcs"
import { CsvService } from './services/csvService';


const query = `
query getSearchResults_matchmaking($first: Int!, $filterBy: String, $with: String, $after: String, $orderBy: String) {
  company {
    searchAccountantListings(first: $first, filterBy: $filterBy, with: $with, after: $after, orderBy: $orderBy) {
      edges {
        cursor
        node {
          entityVersion
          id
          searchId
          type
          person {
            givenName
            middleName
            familyName
            title
            suffix
            fullyQualifiedName
            personMetaModel {
              user {
                description
                primaryContactMethod {
                  title
                  type
                }
              }
            }
            __typename
          }
          telephones {
            telephoneType
            number
            extension
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
              __typename
            }
            __typename
          }
          summary
          website
          companyName
          industries
          languages
          services
          socialLinks {
            name
            url
            __typename
          }
          consultationPrice
          softwareExpertise
          professionalDesignations
          yearsInBusiness
          numberOfPartners
          region
          additionalLanguages
          imageId
          certifications {
            advanced
            expired
            name
            region
          }
          reviewsInfo {
            reviewStats {
              avgProfessionalismRating
              numberOfV2Reviews
              avgExpertiseRating
              avgOverallRating
              numberOfReviews
              avgHelpfulnessRating
              avgResponsivenessRating
            }
          }
        }
      }
    }
  }
}
`;

const graphQLClient = new GraphQLClient('https://accountantmatchmaking.api.intuit.com/v4/graphql', {
  headers: {
    authorization: 'Intuit_APIKey intuit_apikey=prdakyresmylgUdbVpuhf4wHZnk09pUU850acHFg,intuit_apikey_version=1.0',
  },
});

const fetchPage = async (repo: Repository<Contact>, page: number, limit: number = 100, after: string | null): Promise<string> => {
  console.log(`start process page: ${page} after: ${after} ...`);

  const service = new ContactService()

  const pageResult = await graphQLClient.request(query, {
    "after": after,
    "first": limit,
    "filterBy": "criteria.region='GB' && criteria.location.latitude='55.378051' && criteria.location.longitude='-3.435973' && criteria.distanceWithin='1000' && criteria.industryServed=null && criteria.serviceProvided=null && criteria.productSupported=null",
    "with": "version='V2' && intent='combined-3' && visitorId='038404524942896140' && extVisitorId='038404524942896140'"
  })

  const edges = pageResult['company']['searchAccountantListings']['edges']

  let i = 1;
  for (const c of edges) {
    const id = c.node.id
    const searchId = c.node.searchId
    const exists = await repo.createQueryBuilder('c').where(`c.searchId = '${searchId}'`).getOne()
    if (exists) {
      continue
    } else {
      console.log(`'${searchId}' does not exists`)
    }

    const firstName = c.node.person.givenName
    const familyName = c.node.person.familyName
    const aboutMe = c.node.summary ? c.node.summary.replace(/\;/gi, '.').replace(/(\r\n|\n|\r)/gm, ' ') : ''
    const emails = extractEmails(aboutMe).join(',')
    const companyName = c.node.companyName
    const website = c.node.website
    // const socialLinks = c.node.socialLinks.map(x => x.url).join(',')
    // const phones = extractPhones(c.node.telephones).join(',')
    const services = c.node.services ? c.node.services.join(',') : ''
    const industries = c.node.industries ? c.node.industries.join(',') : ''
    const softwareExpertise = c.node.softwareExpertise ? c.node.softwareExpertise.join(',') : ''
    const creds = c.node.professionalDesignations ? c.node.professionalDesignations.join(',') : ''
    const address = extractAddress(c.node.addresses)// c.node.addresses && c.node.addresses.addressComponents ? extractAddress(c.node.addresses.addressComponents) : ''
    const reviewCount = c.node.reviewsInfo.reviewStats.numberOfReviews
    const avgOverallRating = c.node.reviewsInfo.reviewStats.avgOverallRating
    const cursor = c.cursor

    const x = new Contact();
    x.id = id
    x.searchId = searchId
    x.firstName = firstName;
    x.lastName = familyName;
    x.companyName = companyName;
    x.cursor = cursor
    x.address = address
    x.email = emails
    x.website = website
    x.about = aboutMe
    x.services = services
    x.industries = industries
    x.softwareExpertise = softwareExpertise
    x.credentials = creds
    x.reviewCount = reviewCount
    x.reviewAvg = avgOverallRating

    const data = await service.getCustomer(x.searchId, graphQLClient, i)
    if (data) {
      x.phone = data.phone
      x.address = data.address
      x.socialLink = data.socialLink
      await repo.save(x)
      await delay(500)
      i++
    }
  }

  const lastCursor = edges[edges.length - 1].cursor;
  return lastCursor;
}

const main = async (repo: Repository<Contact>) => {
  console.log('Start ...');
  let pageNumber = 1;
  let lastAfter = null;
  const limit = 100;
  const maxPageCount = 50;

  do {
    lastAfter = await fetchPage(repo, pageNumber, limit, lastAfter);
    // console.log(`Next cursor: ${lastAfter}`);
    pageNumber++;
    if (pageNumber >= maxPageCount) {
      break
    }

    await delay(300)
  } while (lastAfter)
}

const options: ConnectionOptions = {
  type: "sqlite",
  database: `${root}/output/proadvisors.sqlite`,
  entities: [Contact],
  // logging: true,
  synchronize: true,
}

createConnection(options).then(async (connection) => {
  const repo = connection.getRepository(Contact)

  const service = new CsvService()
  await service.writeToFile(repo)

  // await main(repo)
  console.log('Success!')
}).catch(error => console.log(error))
