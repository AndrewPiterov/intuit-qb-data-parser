import { Repository } from "typeorm"
import { Contact } from "../entities/contact"
const fs = require('fs')

const addRow = (row: string) => {
  fs.appendFile('./output/list.csv', `\r\n${row}`, (err) => {
    if (err) {
      console.log('Could not append row', err)
    } else {
      // done
    }
  })
}

export class CsvService {
  public writeToFile = async (repo: Repository<Contact>): Promise<boolean> => {
    const all = await repo.find()

    const header = `firstName;familyName;companyName;phones;address;website;socialLinks;emails;services;industries;softwareExpertise;credentials;reviewCount;avgOverallRating;aboutMe`;
    addRow(header)

    for (const c of all) {
      const row = `${c.firstName};${c.lastName};${c.companyName};${c.phone};${c.address};${c.website};${c.socialLink};${c.email};${c.services};${c.industries};${c.softwareExpertise};${c.credentials};${c.reviewCount};${c.reviewAvg};${c.about}`;
      addRow(row)
    }

    return true
  }
}