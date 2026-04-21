import PageHeader from "../../components/PageHeader";
// /Users/amolchaudhari/Downloads/my-portfolio-main/src/components/Button
const Resume = ({ brand }) => {
  return (
    <section className="resume container">
      <PageHeader title="Resume" description="Uncover my expertise" />
      <p className="brand">{brand}</p>
  
      {/* Button to open the resume in a new tab */}
      {/* <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
       <Button className="nav-button" name="Download Resume"/>
      </a> */}
    </section>
  );
};

export default Resume;
