const {
  request,
  GraphQLClient
} = require('graphql-request')

const query = `
  query getSearchResults_matchmaking($first: Int!, $filterBy: String, $with: String, $after: String, $orderBy: String) {
    company {
      searchAccountantListings(first: $first, filterBy: $filterBy, with: $with, after: $after, orderBy: $orderBy) {
        edges {
          node {
            id
            criteria {
              region
              location {
                latitude
                longitude
              }
              distanceWithin
              industryServed
              serviceProvided
              productSupported
            }
            person {
              givenName
              familyName
              middleName
              gender
              dateOfBirth
            }
            imageId
            companyName
            distanceFromSearchLocation
            searchId
            services
            consultationPrice
            professionalDesignations
            summary
            companyName
            customFields {
              value
            }
            addresses {
              addressComponents {
                name
                value
              }
            }
            certifications {
              abbreviation
            }
            reviewsInfo {
              id
              reviewStats {
                numberOfReviews
                avgOverallRating
              }
            }
          }
          cursor
        }
        totalCount
        pageInfo {
          startCursor
          endCursor
          hasNextPage
          hasPreviousPage
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

const fetchPage = async (after: string | null): Promise<string> => {
  console.log(`strart process after  ${after} ...`);

  const pageResult = await graphQLClient.request(query, {
    "after": after,
    "first": 2,
    "filterBy": "criteria.region='GB' && criteria.location.latitude='55.378051' && criteria.location.longitude='-3.435973' && criteria.distanceWithin='1000' && criteria.industryServed=null && criteria.serviceProvided=null && criteria.productSupported=null",
    "with": "version='V2' && intent='combined-3' && visitorId='038404524942896140' && extVisitorId='038404524942896140'"
  })

  for (const c of pageResult.company.searchAccountantListings.edges) {
    console.log('Company name:' + c.node.companyName);
  }

  const lastCursor = pageResult.company.searchAccountantListings.edges[pageResult.company.searchAccountantListings.edges.length - 1].cursor;
  return lastCursor;
}

const main = async () => {
  console.log('Strart ...');

  let pageNumber = 0;
  let lastAfter = null;
  const maxPageCount = 10;

  do {
    lastAfter = await fetchPage(lastAfter);
    pageNumber++;
    await delay(3000);
  } while (!lastAfter || pageNumber < maxPageCount)
}

main().then(_ => console.log('Success!')).catch((err) => console.log(err));

