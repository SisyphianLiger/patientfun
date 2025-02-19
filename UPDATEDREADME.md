# Contact patient


Below is a list of requirements from the doctor:

- View all patients (both contacted and not contacted) - already implemented
  1. Shown in: 


- View details of a single patient - already implemented
  1. Shown in:

- The doctor should see how many patients he / she has been through, as well as how many are remaining, when viewing a patient
  1. Doctor can query how many patients have been contacted?

- The doctor should be able to start iterating through the patients from the patient selected (e.g. number 4 on the list)
  1. 

- The doctor should be able to change the state of the patient to contacted or not contacted
- The doctor should not be required to return to the list view to go to the next patient. There should be some next / previous buttons when viewing a patient. However, being able to iterate through all patients in one go is not a requirement, but something that the doctor insists is needed.
- When the doctor returns to the list view, the most recent data should be displayed (e.g. a patient marked as contacted should be shown as such on the list page) - maybe implemented? You should test this :-)

There are several todos throughout the solution that can be a good idea to start with.

## A comment about the setup
When doing this project, there was a slight issue with the yarn run start-database alias, namely, that it ran the following code:

`"start-database": "docker compose -f docker-compose/docker-compose.yml up"`

This is not the correct command, `docker-compose` is a CLI tool whereas running `docker` runs the acutal application. 

The fix was quite simple, change the `json` to match keywords correctly:
`"start-database": "docker-compose -f docker-compose/docker-compose.yml up"`

## Step One: Improving the patients query:
- View all patients (both contacted and not contacted) - already implemented
- View details of a single patient - already implemented

Solved the Button
- Gender Being Excluded, mention ...parameters
- Mention Query, upon spamming button potential optimization is to change db only when the page is clicked off as opposed to each time the button goes
- Talk about const makeContact setContact
- Talk about api call with axios and ID
- Mention Toggle logic



## TODAYS GOALS
- Use only one list that gets refreshed when back in patient-overview and updates patient overview
- List of PatientIDs cached, one in front and one in back:
    -> Previous : Current : Next
- Update Logic on Number of Patients 
- Update it such that Current Patient Index is based on Index of List


