import React from "react";
import Spinner from "react-bootstrap/Spinner";

const statusMap = {
  pending: (
    <>
      Pending...<Spinner animation="border" role="status"></Spinner>
    </>
  ),
  dropped: <>Dropped! &#x274C;</>,
  bounced: <>Bounced! &#x274C;</>,
  delivered: <>Delivered! &#x2705;</>,
};

export default function PreviousEmailList(props) {
  if (JSON.stringify(props.emailStatus) !== "{}") {
    return (
      <>
        <h6>Email Status</h6>
        <ul>
          {Object.keys(props.emailStatus).map((key) => (
            <li key={key}>
              {props.emailStatus[key].email} -{" "}
              {statusMap[props.emailStatus[key].status]}
            </li>
          ))}
        </ul>
      </>
    );
  } else return <></>;
}
