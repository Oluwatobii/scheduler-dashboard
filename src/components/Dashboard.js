import React, { Component } from "react";
import Loading from "./Loading";
import Panel from "./Panel";
import axios from "axios";

import classnames from "classnames";

import { setInterview } from "helpers/reducers";

import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay,
} from "helpers/selectors";

const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews,
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot,
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay,
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay,
  },
];

class Dashboard extends Component {
  state = {
    loading: false,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {},
  };

  /* Class property with Arrow function - Binding in constructor method */
  /*
  selectPanel = (id) => {
  this.setState({
    focused: id,
    });
  };
  */

  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    if (focused) {
      this.setState({ focused });
    }

    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers"),
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data,
      });
    });
    //this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
    this.socket = new WebSocket("ws://localhost:8001");

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState((previousState) =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  componentWillUnmount() {
    this.socket.close();
  }

  /* Instance Method */
  selectPanel(id) {
    this.setState((previousState) => ({
      focused: previousState.focused !== null ? null : id,
    }));
  }

  render() {
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused,
    });

    const renderPanels = data
      .filter(
        (panel) =>
          this.state.focused === null || this.state.focused === panel.id
      )
      .map((panel) => (
        <Panel
          key={panel.id}
          label={panel.label}
          value={panel.getValue(this.state)}
          onSelect={(event) => this.selectPanel(panel.id)}
        />
      ));

    if (this.state.loading) {
      return <Loading />;
    }

    return <main className={dashboardClasses}> {renderPanels} </main>;
  }
}

export default Dashboard;
