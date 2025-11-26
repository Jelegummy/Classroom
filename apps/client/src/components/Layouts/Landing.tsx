// import Footer from '../Footer'
import Navbar from '../Navbar'

const LandingLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <>
      <div className="flex h-screen flex-col justify-between">
        <div className="mb-auto flex w-full flex-col">
          <Navbar />
          {children}
        </div>
        {/* <Footer /> */}
      </div>
    </>
  )
}

export default LandingLayout
