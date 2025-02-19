# Contact patient

Hello there and thank you for the assignment. Below are the criteria for this assignment as well as my answers and general
logic around why I choose the implementations I did. I will explain my thought process point by point, where each header is 
a requirement for the assignment.



Below is a list of requirements from the doctor:

## View all patients (both contacted and not contacted) - already implemented
This was already implemented but will be commented on later when I allow for a list update to occur :D!

## View details of a single patient - already implemented
This is also already implemented, but will be improved upon with the contact button

## Some important Mentions before going further
There were was one issued I had when starting the database, that was that the JSON text to run docker-compose missed its - and was unable to run Docker. 
In my repository, you should be able to see the correct docker commmand to run the mariaDB db.

```go
  // Changed from:
  "scripts": {
    "start-database": "docker compose -f docker-compose/docker-compose.yml up"
  },                         ^

  // To This
  "scripts": {
    "start-database":  "docker-compose -f docker-compose/docker-compose.yml up"
  },                          ^
```

## The doctor should see how many patients he / she has been through, as well as how many are remaining, when viewing a patient

To solve this problem, I first identified where the logic would be used. In this project I mainly used the files `patient-overview-page.tsx` and
`patient-page.tsx`. What I identified was that upon clicking view was that no information of the amount of patients had been sent to the `patient-page.tsx`. Therefore, I used a component, `history`, given I could see it was in use in the `patient-overview-page.tsx` already. That meant that I created a interfcace, that would send data, namely, a list of all patientID's, that would then be used to tally the length of patients, i.e. display the number of patients on a given list. 

This is the history I decided to push to the `patient-page.tsx`
```ts

  // This is the history pushed to patient-page when View is clicked
  history.push({
    pathname: PatientUrl.replace(':patientId', record.id),
    state: {
      totalPatients: patients.length,
      currentIndex: currentIndex,
      patientIDs: patientIDs,
      isContacted: filterContacted,
    }
  })
   
  // Using an interface I create default values in case information gets lost, and take relevant information over to patient page
  interface LocationState {
    totalPatients: number;
    isContacted: boolean;
    currentIndex: number;
    patientIDs: string[];
  }

  const { totalPatients, currentIndex, patientIDs } = location.state || {
    totalPatients: 0,
    currentIndex: 1,
    patientIDs: [],
    isContacted: false,
  };

  // There some upgraded state involved because patients count starts at 1 not 0, but these variables are derived from the history
  <h1>({currentPosition} / {remainingPatients}) Patient: {patient.ssn}</h1> </div>

```


##  The doctor should be able to start iterating through the patients from the patient selected (e.g. number 4 on the list)

For this functionality, there was already two buttons, with left and right arrows that I decided to use a function on. It is important to note
that the number for current Position, when the initial view is rendering is created by calculating the currentIndex of the patient selected. This 
is calculated by `const currentIndex:number = patients.findIndex(p => p.id === record.id) ?? 0;` in the `patient-overview-page.tsx` file before being 
pushed as history. I also only push the relevant ids into the patientIDs, meaning one for contacted one for without, as the list will be updated via API call and refresed when the user clicks the back button. 

My thought process with this strategy is although we could have n = 1000+ patients, the cycling of said patients are going to be the most frequent, given the task is to go through a list of patients and check as well as submit if said patient is contacted. So, the List in `patient-overview.tsx` should be called less frequently then in the `patient-page.tsx`. Having the IDs would allow patch request to the specific patients, without the need of having 1000 patients in memory, but rather their ID's. 

The code below shows how the user can iterate through the list of employees
```ts

  // The states for 1 based Indexing
  const [currentPosition, setCurrentPosition] = useState(currentIndex+1);
  const [remainingPatients, setRemainingPatients] = useState(totalPatients);

  // The code to determin on click what happens when a patient 
  const updateDirection = (direction: boolean) => {
    let newIndex:number;

    // Updates cursor if list mutation is not neccesary
    if (direction) {
        setCurrentPosition(p=>p+1);
        newIndex = currentIndex + 1;
    } else {
        newIndex = currentIndex - 1;
        setCurrentPosition(p=>p-1);
    }

    return {updatedList: patientIDs,
            updatedIndex: newIndex};
  };


  const goToPreviousPatient = () => {
    if (currentIndex === 0){
      return;
    }
      const { updatedList, updatedIndex } = updateDirection(false) as { updatedList: string[], updatedIndex: number };

      setPatientId(updatedList[updatedIndex]);
      history.push({
        pathname: PatientUrl.replace(':patientId', String(updatedList[updatedIndex])),
        state: {
          totalPatients: remainingPatients,
          currentIndex: updatedIndex,
          patientIDs: updatedList,
        }
      });

  };
  
  const goToNextPatient =  () => {
    if (currentIndex >= remainingPatients){
      return;
    }

      const { updatedList, updatedIndex } =  updateDirection(true) as { updatedList: string[], updatedIndex: number };

      setPatientId(updatedList[updatedIndex]);
      history.push({
        pathname: PatientUrl.replace(':patientId', String(updatedList[updatedIndex])),
        state: {
          totalPatients: remainingPatients,
          currentIndex: updatedIndex,
          patientIDs: updatedList,
          isContacted: isContacted,

        }
      });
  };
```

What's important to note here, is that by abstracting updateDirection from goTo, we can implement updateDirection as well as test for it indiviually.
Overall the data flow is as followed, the user starts at a given point from the filtered list based on the currentIndex. The user can than cycle back and forth up until there is no longer a lead or end user. This is done by making a `history.replace()` call on the current patientId, changing it to the next or previous in the list of Ids.

## The doctor should be able to change the state of the patient to contacted or not contacted

There had already been a Button given at the top of the screen that indicated if a patient was contacted or not, but I decided to be a little bit more advance here. Instead of using that button soley, I added a new Button. This button would turn green, upon the information that a contact recieved new information. If the user selected the button when it was not updated, an error message under the button would appear, to show the user that this contact information is up to date. Given that we want to prevent as many API calls for Patch as neccesary, I decided to use state to manage the whether or not a update was needed. The code below, shows the states involved to manage both list possibilities, Contacted, and Non Contacted. 

(I did not see it as a requirement but it could be the case that the user make a mistake and would like to make a contacted user go to non-contacted).

```ts

  // Used to Show Button color and interact with needsUpdate
  const [markedContacted, setMarkedContacted] = useState(isContacted ?? false);

  // Used to demarcate when to update the DB or ignore
  const [needsUpdate, setNeedsUpdate] = useState(!isContacted ?? false)

  // 

  // UpdatedInformation only triggers when needsUpdate is True and creates a copy of the preexisting list
  // that will then exclude the member sent to the database (which will appear upon list refresh).
  const updatedInformation = () => {
      if (!needsUpdate) {
          throw new Error("Contact information is already up to date");
      }

      if (!patient) {
          throw new Error("No Patient Currently Selected");
      }

      let newIndex:number;

      if (patient) {
      let tempPatientIDs = [...patientIDs];

      // Send update to DB
      updateMarkedContact(patientIDs[currentIndex]);

      // Make sure we're comparing the right types
      tempPatientIDs = tempPatientIDs.filter(id => String(id) !== String(patient.id));


      // New length Set for viewed patients remaining
      setRemainingPatients(tempPatientIDs.length);


      if (currentIndex === 0){
        newIndex = 0;
      } else {
        newIndex = currentIndex - 1;
      }


      // Fixed the maxout one
      if (currentPosition !== 1) {
        setCurrentPosition(p => p-1);
      }


      setNeedsUpdate(!patient.contacted);
      return {
        updatedList: tempPatientIDs,
        updatedIndex: newIndex
      };
    }
  };

  // This is the main function for the button, which will reset any and all error messages, before trying to
  // send a patch call to the Database, and update the history with a new patient ID and index.
  const sendPatientContactInfo = () => {
      try {

      setErrorMessage(null);
      const { updatedList, updatedIndex } = updatedInformation() as { updatedList: string[], updatedIndex: number };

      if(updatedList.length > 0) {
        setPatientId(updatedList[updatedIndex]);
        history.push({
          pathname: PatientUrl.replace(':patientId', String(updatedList[updatedIndex])),
          state: {
            totalPatients: remainingPatients,
            currentIndex: updatedIndex,
            patientIDs: updatedList,
            isContacted: isContacted,
          }
        });
      } else {
        history.push({pathname: PatientOverviewUrl,
                      state: {refresh: true,
                    }
        });
      }
      } catch (error: any) {
        setErrorMessage(error.message);
      }
  }

  // Button that handles the logic of what do display, if Contacted List, we need the butotn to show
  // Green when we want to deselect the user and vice versa, also with button text, finally the last bit
  // is the error message displayed when we cannot remove a contact because it is up to date
        <Button
          icon={ <CheckCircleOutlined /> }
          type="primary"
          style={{
            backgroundColor: !isContacted
              ? (needsUpdate ? '#52c41a' : '#1890ff')  // On contacted list
              : (!needsUpdate ? '#1890ff' : '#52c41a'), // On non-contacted list
            borderColor: isContacted
              ? (needsUpdate ? '#52c41a' : '#1890ff')  // On contacted list
              : (!needsUpdate ? '#1890ff' : '#52c41a')  // On non-contacted list
          }}
          onClick={() => {
            sendPatientContactInfo();
          }}
        >
          {!isContacted ? "Send Update" : "Remove From Contacted" }
        </Button>

      </div>
      {errorMessage && (
        <div style={{
          color: 'red',
          flexDirection: 'column',
          marginTop: '10px',
          textAlign: 'center'
        }}>
          {errorMessage}
        </div>
        )}
```

##  The doctor should not be required to return to the list view to go to the next patient. There should be some next / previous buttons when viewing a patient. However, being able to iterate through all patients in one go is not a requirement, but something that the doctor insists is needed.

Given this is not a requirement, but works with my logic, you can see the `goToNextPatient` and `goToPrevPatient`, to see how I update both the list of PatientID's and currentPosition. CurrentPosition is state used to manage the 1-based Index.


## When the doctor returns to the list view, the most recent data should be displayed (e.g. a patient marked as contacted should be shown as such on the list page) - maybe implemented? You should test this :-)

So, I found out with some exploration of the API, that the Patch call incorrectly updated with a user. Meaning when I was trying to figure this out, I kept on seeing Gustavo. 

```ts
  // Here we do not do anything with id, but rather pass the patient id which doesn not work
  async update(
    id: string,
    patient: UpdatePatientDto
  ): Promise<DetailedPatientDto> {
    const existingPatient = await this.repo.findOne(patient.id);

    if (!existingPatient) {
      throw new NotFoundException(`Patient with id ${patient.id} not found`);
    }

    return this.repo.save({
      ...existingPatient,
      ...patient,
    });
  }

  // The fix is to replace patient.id with id and so my query works
  async update(
    id: string,
    patient: UpdatePatientDto
  ): Promise<DetailedPatientDto> {
    const existingPatient = await this.repo.findOne(id);

    if (!existingPatient) {
      throw new NotFoundException(`Patient with id ${id} not found`);
    }

    return this.repo.save({
      ...existingPatient,
      ...patient,
    });
  }
```

I am not sure if this was the bug, but sending the response body that was given back did not work. So, the fix was to use the parameter id, to properly send the correct information to the db.


## Conclusion
There is definitely room for improvement, but I wanted to send this to you all sooner rather than later so you could see a good estimate of my work. I can say this is the first time using React as a framework since University, so there may be some inconsistencies and what not within Best Practices, but I tried my best to follow the project style given, i.e. using `history.push()`. 
