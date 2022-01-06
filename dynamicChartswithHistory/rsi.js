const line = () => {
  new Chart(document.getElementById("line-chart"), {
    type: "line",
    data: {
      labels: [1500, 1600, 1700, 1750, 1800],
      datasets: [
        {
          data: [86, 114, 106, 106, 107],
          borderColor: "#3e95cd",
          fill: true,
        },
      ],
    },
    options: {
      scales: {
        myScalse: {
          position: "right",
        },
      },
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      title: {
        display: false,
      },
    },
  });
};

line();
