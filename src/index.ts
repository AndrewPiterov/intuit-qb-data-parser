const {
  request,
  GraphQLClient
} = require('graphql-request')
var fs = require('fs')

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

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const extractEmails = (text: string): string[] => {
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

const extractAddress = (address: any[]): string => {
  if (!address) {
    return '';
  }
  const resultString = address.map(x => !x.addressComponents ? '' : x.addressComponents.map(c => c.value).filter(c => c != 'false' && c != 'true')).join(' ')
  // console.log('Address is', resultString)
  return resultString
}

const fetchPage = async (page: number, after: string | null): Promise<string> => {
  console.log(`start process after ${after} ...`);

  const pageResult = await graphQLClient.request(query, {
    "after": after,
    "first": 100,
    "filterBy": "criteria.region='GB' && criteria.location.latitude='55.378051' && criteria.location.longitude='-3.435973' && criteria.distanceWithin='1000' && criteria.industryServed=null && criteria.serviceProvided=null && criteria.productSupported=null",
    "with": "version='V2' && intent='combined-3' && visitorId='038404524942896140' && extVisitorId='038404524942896140'"
  })

  fs.appendFile(`./output/page_${page}.json`, JSON.stringify(pageResult), (err) => {
    if (err) {
      // append failed
    } else {
      // done
    }
  })

  for (const c of pageResult.company.searchAccountantListings.edges) {
    const firstName = c.node.person.givenName
    const familyName = c.node.person.familyName
    const aboutMe = c.node.summary ? c.node.summary.replace(/\;/gi, '.') : ''
    const emails = extractEmails(aboutMe).join(',')
    const companyName = c.node.companyName
    const website = c.node.website
    const socialLinks = c.node.socialLinks.map(x => x.url).join(',')
    const phones = c.node.telephones ? c.node.telephones.map(x => `(${x.extension})${x.number}`) : ''
    const services = c.node.services ? c.node.services.join(',') : ''
    const industries = c.node.industries ? c.node.industries.join(',') : ''
    const softwareExpertise = c.node.softwareExpertise ? c.node.softwareExpertise.join(',') : ''
    const creds = c.node.professionalDesignations ? c.node.professionalDesignations.join(',') : ''
    const address = extractAddress(c.node.addresses)// c.node.addresses && c.node.addresses.addressComponents ? extractAddress(c.node.addresses.addressComponents) : ''

    const reviewCount = c.node.reviewsInfo.reviewStats.numberOfReviews
    const avgOverallRating = c.node.reviewsInfo.reviewStats.avgOverallRating

    const row = `${firstName};${familyName};${companyName};${phones};${address};${website};${socialLinks};${emails};${services};${industries};${softwareExpertise};${creds};${reviewCount};${avgOverallRating}`;
    addRow(row)
  }

  const lastCursor = pageResult.company.searchAccountantListings.edges[pageResult.company.searchAccountantListings.edges.length - 1].cursor;
  return lastCursor;
}

const addRow = (row: string) => {
  fs.appendFile('./output/list.csv', `\r\n${row}`, (err) => {
    if (err) {
      console.log('Could not append row', err)
    } else {
      // done
    }
  })
}

const main = async () => {
  console.log('Start ...');
  let pageNumber = 1;
  let lastAfter = null;
  const maxPageCount = 1;

  addRow('FirstName;LastName;CompanyName;Phones;Address;Website;SocialLinks;Emails;Services;Industries;SoftwareExpertise;Credentials;ReviewCount;AvgRating')

  do {
    lastAfter = await fetchPage(pageNumber, lastAfter);
    // console.log(`Next cursor: ${lastAfter}`);
    pageNumber++;
    if (pageNumber >= maxPageCount) {
      break
    }

    await delay(3000);
  } while (lastAfter)
}

main().then(_ => console.log('Success!')).catch((err) => console.log(err));

