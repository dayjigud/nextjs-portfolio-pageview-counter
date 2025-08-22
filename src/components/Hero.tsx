const Hero = () => {
  return (
    <section className="section pt-28" id="home">
      <div className="container text-center">
        <div
          className="bg-secondary rounded-2xl shadow-clay p-8 md:p-12"
        >
          <h1
            className="text-4xl md:text-6xl font-bold mb-4 gradient-text"
          >
            Ayodeji Adeniyi
          </h1>
          <p
            className="text-lg md:text-xl text-text-dark font-semibold mb-8"
          >
            AI Product Manager | Technology Innovator | Data Analyst
          </p>
          <p
            className="max-w-3xl mx-auto mb-8"
          >
            A Technological Polymath bridging mechanical engineering foundations with cutting-edge AI innovation in Nigeria's evolving tech landscape.
          </p>
          <a
            href="#contact"
            className="btn btn-primary"
          >
            Get in Touch
          </a>
        </div>
      </div>
    </section>
  )
}

export default Hero