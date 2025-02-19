import { LeftOutlined, RightOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { DetailedPatientDto,  UpdatePatientDto } from '@contact-patient/dtos';
import { Button, Descriptions, Skeleton } from 'antd';
import axios from 'axios';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { RouteComponentProps, useHistory, useLocation } from 'react-router-dom';
import { PatientOverviewUrl, PatientUrl } from '../urls';

// Interface to handle incoming History from Patient-overview
interface LocationState {
  totalPatients: number;
  isContacted: boolean;
  currentIndex: number;
  patientIDs: string[];
}

export type PatientPageProps = RouteComponentProps<{ patientId: string }>;

export function PatientPage(props: PatientPageProps) {
  // Get the history object for navigation
  const history = useHistory();

  // Detailed patient state
  const [patient, setPatient] = useState<DetailedPatientDto>();

  // State for loading detailed patient
  const [loadingPatient, setLoadingPatient] = useState(false);

  // Used to Display Errors to the user
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

   // Used from Patients loading page to find index of users
  const location = useLocation<LocationState>();
  const { totalPatients, currentIndex, patientIDs } = location.state || {
    totalPatients: 0,
    currentIndex: 1,
    patientIDs: [],
    isContacted: false,
  };
  // Marked Button State
  const isContacted = location.state.isContacted;

  // Used to Show Button color and interact with needsUpdate
  const [markedContacted, setMarkedContacted] = useState(isContacted ?? false);

  // Used to demarcate when to update the DB or ignore
  const [needsUpdate, setNeedsUpdate] = useState(!isContacted ?? false)

  // Used to set the next patient from next/prev
  const [patientId, setPatientId] = useState(props?.match?.params?.patientId);

  // Needed for 1 Based Indexing
  const [currentPosition, setCurrentPosition] = useState(currentIndex+1);
  const [remainingPatients, setRemainingPatients] = useState(totalPatients);



/**
 * Fetch patient details when ID changes.
 * Also refreshes values for needsUpdate and MarkedCountact upon new  patient
 */
useEffect(() => {
    if (!patientId) {
        return;
    }

    setLoadingPatient(true);

    axios
        .get(`http://localhost:3333/patients/${patientId}`)
        .then((response) => {
            setPatient(response.data);
            setMarkedContacted(!isContacted);
            setNeedsUpdate(false);
            setLoadingPatient(false);

        })
        .catch(error => {
            console.error('GET request failed:', error);
            setLoadingPatient(false);
        });
}, [patientId]);


/**
    Function to seperate api call to update patient contact status
    Uses isContacted from history and update to determine if a send to the
    DB is needed
 */
  const updateMarkedContact = (patientID: string) => {
    if (needsUpdate) {

      const params: UpdatePatientDto = {
        contacted: !isContacted,
      };

      axios.patch(`http://localhost:3333/patients/${patientID}`, params)
        .then((response) => {
        })
        .catch(error => {
            throw new Error("Contact information is already up to date");
        })
    }
  }
  /**
   * Function for marking a patient as contacted or not contacted,
   * Will change in memory patient info but not Database memory info
   *
   *    */

  const markContacted = () => {

    setErrorMessage(null);

    setMarkedContacted(m => !m);
    if (markedContacted !== isContacted) {
      setNeedsUpdate(true);
    } else {
      setNeedsUpdate(false);
    }

    if(patient) {
      setPatient({
        ...patient,
        contacted: markedContacted
      });
    }
  };

  /**
   * Changes current index position and updates the 1 based index displayed to user
   * based on direction input
   * @direction: boolean
   */
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


  /**
   * Function for going to the previous patient and sends updated history
   */
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

  /**
   * Function for going to the next patient.and sends updated history
   */
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


  /**
   * Function is called when Patch to a DB is required, a new list is made from .filter() and
   * a destructured tuple of currentIndex and newList is returned
  */
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


  /*
   * Function that handles sending to the database and updating history
   * CHECK updatedInformation() for more details
   * */
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





  // If loading patient, show loading animation
  if (loadingPatient) {
    return <Skeleton />;
  }

  // If no patient found for id, show error message
  if (!patient) {
    return <p>No patient found for id: "{patientId}"</p>;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '50px',
        }}
      >
        <div
          style={{ display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <Button
            icon={<LeftOutlined />}
            onClick={() => {

              history.push({pathname: PatientOverviewUrl,
                            state: {refresh: true,
                                    isFiltered: !isContacted,
                }
              });

            }}
          />
          <h1>({currentPosition} / {remainingPatients}) Patient: {patient.ssn}</h1> </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <Button
            type="primary"
            onClick={() => {
                            goToPreviousPatient();
            }}
            icon={<LeftOutlined />}
            // TODO - maybe update the disabled state?
            disabled={currentPosition === 1}
          />

          <Button
            type="primary"
            onClick={() => {
              markContacted()}}
          >
            {patient.contacted ? 'Contacted' : 'Not Contacted'}
          </Button>
          <Button
            type="primary"
            onClick={() => {
                        goToNextPatient()
            }}
            icon={<RightOutlined />}
            // TODO - maybe update the disabled state?
            disabled={currentPosition === remainingPatients}
          />
        </div>
      </div>

      <Descriptions>
        <Descriptions.Item label="First name">
          {patient.firstName}
        </Descriptions.Item>
        <Descriptions.Item label="Last name">
          {patient.lastName}
        </Descriptions.Item>
        <Descriptions.Item label="Contacted">
          {patient.contacted ? 'Yes' : 'No'}
        </Descriptions.Item>
        <Descriptions.Item label="Gender">
          {patient.gender?.name}
        </Descriptions.Item>
        <Descriptions.Item label="Patient created">
          {format(new Date(patient.created), 'dd-MM-yyyy')}
        </Descriptions.Item>
        <Descriptions.Item label="Patient updated">
          {format(new Date(patient.updated), 'dd-MM-yyyy')}
        </Descriptions.Item>
      </Descriptions>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '20px'
        }}
      >
        <Button
          icon={ <CheckCircleOutlined /> }
          type="primary"
          style={{
            backgroundColor: !isContacted
              ? (needsUpdate ? '#52c41a' : '#1890ff')
              : (!needsUpdate ? '#1890ff' : '#52c41a'),
            borderColor: isContacted
              ? (needsUpdate ? '#52c41a' : '#1890ff')
              : (!needsUpdate ? '#1890ff' : '#52c41a')
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

    </div>
  );
}
