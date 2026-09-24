import React from "react";
import { motion } from "motion/react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Locations() {
  const regions = [
    {
      name: "West Region",
      description: "CA, WA, OR, NV, AZ, CO, UT, ID, MT, WY, AK, HI",
      locations: [
        "Alaska", "Arizona", "Aurora, Colorado", "Avondale, AZ", "Bakersfield, California", "Beaverton, Oregon", "Bellevue, Washington", "Bellingham, Washington", "Benson, Arizona", "Berkeley, CA", "Boise City, Idaho", "Boulder City, Nevada", "Brea, CA", "Brighton, Colorado", "Broomfield, Colorado", "Buena Park, CA", "Caldwell, ID", "California", "Carlsbad, CA", "Casa Grande, Arizona", "Castle Rock, Colorado", "Chandler, AZ", "Chula Vista, CA", "Clackmas, Oregon", "Clovis, California", "Colorado Springs, Colorado", "Colorado", "Commerce City, Colorado", "Cypress, CA", "Davis, California", "Denver, Colorado", "Dinuba, California", "El Cajon, CA", "Elk Grove, CA", "Eloy, Arizona", "Englewood, Colorado", "Escondido, CA", "Everett, Washington", "Federal Way, Washington", "Folsom, California", "Fremont, CA", "Fresno, California", "Fullerton, CA", "Galt, California", "Garden Grove, CA", "Gilbert, AZ", "Gilroy, CA", "Glendale, AZ", "Goodyear, AZ", "Green Valley, Arizona", "Gresham, Oregon", "Hanford, California", "Hawaii", "Hayward, CA", "Henderson, Nevada", "Hillsboro, Oregon", "Honolulu, Hawaii", "Idaho", "Irvine, CA", "Jean, Nevada", "Kent, Washington", "Kerman, California", "Kingman, Arizona", "Kingsburg, California", "La Mesa, CA", "Lakewood, Colorado", "Las Vegas, Nevada", "Livermore, CA", "Lodi, California", "Long Beach, California", "Longmont, Colorado", "Los Angeles, California", "Madera, California", "Marana, Arizona", "McClellan Park, CA", "Meridian, Idaho", "Mesa, Arizona", "Mesquite, Nevada", "Milpitas, CA", "Moapa Valley, Nevada", "Montana", "Morgan Hill, CA", "Nampa, Idaho", "Napa, CA", "National City, CA",
      ],
    },
    {
      name: "Midwest Region",
      description: "IL, IN, OH, MI, WI, MN, MO, IA, KS, NE, SD, ND",
      locations: [
        "Aberdeen, South Dakota", "Allen Park, MI", "Alsip, IL", "Arnold, MO", "Aurora, IL", "Avon, IN", "Bedford Park, IL", "Belleville, IL", "Bellevue, Nebraska", "Belvidere, Illinois", "Bismarck, North Dakota", "Bloomington, Minnesota", "Blue Ash, OH", "Blue Springs, MO", "Bolingbrook, IL", "Bonner Springs, Kansas", "Branson, MO", "Brookfield, WI", "Brownsburg, IN", "Burlington, WI", "Canton, MI", "Carmel, IN", "Cedar Rapids, Iowa", "Chesterfield, MO", "Cicero, IL", "Cincinnati, Ohio", "Clarksville, IN", "Cleveland, Ohio", "Collinsville, IL", "Columbia, MO", "Columbus, IN", "Columbus, Ohio", "Davenport, Iowa", "Dearborn Heights, MI", "Dearborn, MI", "Des Moines, Iowa", "Des Plaines, IL", "Dublin, OH", "Duluth, Minnesota", "Earth City, MO", "Edwardsville, Kansas", "Elgin, IL", "Elk Grove Village, IL", "Evanston, IL", "Fairfield, OH", "Fargo, North Dakota", "Fenton, MO", "Ferndale, MI", "Fishers, IN", "Flat Rock, MI", "Florissant, MO", "Fort Wayne, IN", "Franklin, WI", "Gahanna, OH", "Gary, IN", "Geneva, IL", "Granite City, IL", "Green Bay, WI", "Greenfield, WI", "Greensburg, IN", "Greenwood, IN", "Grove City, OH", "Hamilton, OH", "Hazelwood, MO", "Hilliard, OH", "Illinois", "Independence, MO", "Indiana", "Iowa", "Joliet, IL", "Joplin, MO", "Kansas City, MO", "Kansas", "Kenosha, WI", "Kohler, WI", "Kokomo, IN", "Lafayette, IN", "Leavenworth, Kansas", "Lebanon, IN", "Lebanon, MO", "Lee's Summit, MO", "Lenexa, KS", "Liberty, Missouri", "Lincoln Park, MI", "Lincoln, Nebraska", "Livonia, MI", "Lordstown, Ohio", "Madison, WI", "Maryland Heights, MO", "Mason, OH", "McCordsville, IN", "Mequon, WI", "Michigan", "Minnesota",
      ],
    },
    {
      name: "Northeast Region",
      description: "NY, NJ, PA, MA, CT, RI, NH, VT, ME",
      locations: [
        "Albany, New York", "Allentown, Pennsylvania", "Amherst, New York", "Babylon Town, New York", "Bayonne, NJ", "Bensalem, PA", "Boston, Massachusetts", "Braintree, Massachusetts", "Bridgeport, Connecticut", "Brockton, Massachusetts", "Brookhaven, New York", "Buffalo, New York", "Burlington, NJ", "Burlington, Vermont", "Camden, NJ", "Cheektowaga, New York", "Chelsea, Massachusetts", "Cherry Hill, NJ", "Chester, PA", "Clarkstown, New York", "Colonie Town, New York", "Connecticut", "Conshohocken, PA", "Edison, NJ", "Elizabeth, NJ", "Erie, Pennsylvania", "Everett, Massachusetts", "Framingham, Massachusetts", "Greece, New York", "Greenburgh, New York", "Hackensack, NJ", "Hartford, Connecticut", "Hempstead Town, New York", "Huntington, New York", "Islip, New York", "Jersey City, NJ", "Lawrence, Massachusetts", "Levittown, PA", "Maine", "Manchester, New Hampshire", "Massachusetts", "Nashua, New Hampshire", "New Hampshire", "New Haven, Connecticut", "New Jersey", "New Rochelle, New York", "New York City, New York", "New York", "Newark, NJ", "Newport, Rhode Island", "Norristown, PA", "North Hempstead, New York", "Norwalk, Connecticut", "Norwood, Massachusetts", "Oyster Bay, New York", "Paterson, NJ", "Paulsboro, NJ", "Peabody, Massachusetts", "Pennsylvania", "Philadelphia, Pennsylvania", "Pittsburgh, Pennsylvania", "Providence, Rhode Island", "Ramapo, New York", "Reading City, Pennsylvania", "Rhode Island", "Rochester City, New York", "Rutland, Vermont", "Scranton, Pennsylvania", "Secaucus, NJ", "Smithtown, New York", "Stamford, Connecticut", "Staten Island, NY", "Syracuse, New York", "Taunton, Massachusetts", "Upper Darby, Pennsylvania", "Vermont", "Waterbury, Connecticut", "Woburn, Massachusetts", "Yonkers, New York",
      ],
    },
    {
      name: "Southeast Region",
      description: "FL, GA, SC, NC, VA, WV, KY, TN, AL, MS",
      locations: [
        "Airport West, GA", "Alabama", "Alexandria, Virginia", "Alpharetta, GA", "Arlington, TN", "Virginia Beach, Virginia", "Athens, GA", "Atlanta, GA", "Bartlett, TN", "Berea, KY", "Bowling Green, KY", "Brandon, FL", "Calhoun, GA", "Chantilly, Virginia", "Charleston, South Carolina", "Charleston, West Virginia", "Charlotte, North Carolina", "Chattanooga, TN", "Chesapeake, Virginia", "Clarksville, Tennessee", "Clearwater, FL", "College Park, GA", "Collierville, TN", "Columbia, South Carolina", "Concord, North Carolina", "Conley, GA", "Covington, KY", "Duluth, GA", "Durham, NC", "East Point, GA", "Elizabethtown, KY", "Fairburn, GA", "Fernandina Beach, Florida", "Florence, KY", "Florida", "Forest Park, GA", "Fort Mill, South Carolina", "Franklin, Tennessee", "Gallatin, Tennessee", "Gastonia, North Carolina", "Georgetown, KY", "Georgia", "Germantown, TN", "Goodlettsville, Tennessee", "Green Cove Springs, Florida", "Hampton, Virginia", "Harrodsburg, KY", "Horn Lake, MS", "Huntington, West Virginia", "Huntsville, AL", "Indian Trail, North Carolina", "Jacksonville, Florida", "Kannapolis, North Carolina", "Kentucky", "Kingsland, Georgia", "La Vergne, Tennessee", "Lake City, Florida", "Lakeland, FL", "Largo, FL", "Lawrenceburg, KY", "Lebanon, Tennessee", "Lexington, KY", "Lithia Springs, GA", "Lyndon, KY", "Macclenny, Florida", "Macon, GA", "Manassas, Virginia", "Marietta, GA", "McDonough, GA", "Memphis, TN", "Miami, Florida", "Middleburg, Florida", "Middletown, KY", "Millington, TN", "Mississippi", "Monroe, North Carolina", "Mooresville, North Carolina", "Mount Pleasant, South Carolina", "Mt. Juliet, Tennessee", "Murfreesboro, Tennessee", "Nashville, Tennessee", "Newport News, Virginia", "Nicholasville, KY", "Norcross, GA", "Norfolk, Virginia", "North Carolina", "North Charleston, South Carolina",
      ],
    },
    {
      name: "South Region",
      description: "TX, OK, LA, AR",
      locations: [
        "Alief, TX", "Arkansas", "Arlington, TX", "Austin, Texas", "Baton Rouge, Louisiana", "Baytown, TX", "Bedford, TX", "Bellaire, TX", "Buda, TX", "Canutillo, Texas", "Carrollton, TX", "Cedar Park, TX", "Cinco Ranch, TX", "Clint, Texas", "Converse, TX", "Corpus Christi, Texas", "Dallas, Texas", "Deer Park, TX", "Del City, Oklahoma", "Edmond, Oklahoma", "El Paso, Texas", "El Reno, Oklahoma", "Euless, TX", "Fabens, Texas", "Fayetteville, AR", "Fort Smith, Arkansas", "Fresno, TX", "Friendswood, TX", "Frisco, TX", "Galena Park, TX", "Galveston, TX", "Garland, TX", "Georgetown, TX", "Grapevine, TX", "Guthrie, Oklahoma", "Hurst, TX", "Hutto, TX", "Irving, TX", "Jonesboro, Arkansas", "Katy, TX", "Keller, TX", "Kyle, TX", "La Porte, TX", "Lafayette, Louisiana", "Laredo, TX", "League City, TX", "Little Rock, Arkansas", "Lockhart, TX", "Louisiana", "McKinney, TX", "Meadows Place, TX", "Mesquite, TX", "Metairie, Louisiana", "Midwest City, Oklahoma", "Missouri City, TX", "Moore, Oklahoma", "Mustang, Oklahoma", "New Orleans, Louisiana", "Norman, Oklahoma", "Oklahoma City, Oklahoma", "Oklahoma", "Pasadena, TX", "Pearland, TX", "Pecan Grove, TX", "Pflugerville, TX", "Plano, TX", "Pleasanton, TX", "Richardson, TX", "Richmond, TX", "Rosenberg, TX", "Round Rock, TX", "San Antonio, Texas", "San Marcos, TX", "Schertz, TX", "Shawnee, Oklahoma", "Shreveport, Louisiana", "Socorro, Texas", "Southlake, TX", "Springdale, Arkansas", "Stafford, TX", "Taylor, TX", "Texas", "The Woodlands, TX", "Tornillo, Texas",
      ],
    },
    {
      name: "Central Region",
      description: "CO, MO, IA, NE, KS",
      locations: [
        "Arnold, MO", "Aurora, Colorado", "Bellevue, Nebraska", "Blue Springs, MO", "Bonner Springs, Kansas", "Branson, MO", "Brighton, Colorado", "Broomfield, Colorado", "Castle Rock, Colorado", "Cedar Rapids, Iowa", "Chesterfield, MO", "Colorado Springs, Colorado", "Colorado", "Columbia, MO", "Commerce City, Colorado", "Davenport, Iowa", "Denver, Colorado", "Des Moines, Iowa", "Earth City, MO", "Edwardsville, Kansas", "Englewood, Colorado", "Fenton, MO", "Florissant, MO", "Hazelwood, MO", "Independence, MO", "Iowa", "Joplin, MO", "Kansas City, MO", "Kansas", "Lakewood, Colorado", "Leavenworth, Kansas", "Lebanon, MO", "Lee's Summit, MO", "Lenexa, KS", "Liberty, Missouri", "Lincoln, Nebraska", "Longmont, Colorado", "Maryland Heights, MO", "Missouri", "Nebraska", "O'Fallon, MO", "Olathe, KS", "Omaha, Nebraska", "Overland Park, KS", "Riverside, MO", "Rolla, MO", "Shawnee, Kansas", "Sioux City, Iowa", "St. Charles, MO", "St. Joseph, MO", "Thornton, Colorado", "Topeka, KS", "Underground Warehouses, MO", "Wentzville, MO", "Westminster, Colorado", "Wichita, Kansas",
      ],
    },
  ];

  const headquartersInfo = {
    address: "#7 Gateway Commerce Center Dr. W, Suite 7",
    city: "Edwardsville, IL 62025, USA",
    phone: "+1(336)4596552",
    email: "buskelogistics141@gmail.com",
    hours: "Monday – Friday, 8:30 AM – 5:00 PM",
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-[#0F1F3D] via-[#1A365D] to-[#2563EB] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDEyYzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] " />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Buske Logistics Global Operations
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
              40+ Locations | 7.5M+ Square Feet | Worldwide Deliveries | US, Canada & International
            </p>
          </motion.div>
        </div>
      </section>

      {/* Headquarters Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#2563EB] to-[#38BDF8] rounded-2xl p-12 shadow-2xl text-white"
          >
            <h2 className="text-4xl font-bold mb-8">Corporate Headquarters</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <div className="flex items-start gap-4 mb-6">
                  <MapPin className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-lg">{headquartersInfo.address}</div>
                    <div className="text-blue-100">{headquartersInfo.city}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <Phone className="w-6 h-6 flex-shrink-0" />
                  <a href={`tel:${headquartersInfo.phone}`} className="hover:text-blue-100 transition-colors">
                    {headquartersInfo.phone}
                  </a>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <Mail className="w-6 h-6 flex-shrink-0" />
                  <a href={`mailto:${headquartersInfo.email}`} className="hover:text-blue-100 transition-colors">
                    {headquartersInfo.email}
                  </a>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-lg mb-2">Business Hours</div>
                    <div className="text-blue-100">{headquartersInfo.hours}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Regional Hubs */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1F3D] mb-4">
              Global Distribution Network
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              With networks across North America and capability for worldwide deliveries, Buske Logistics connects your business to markets everywhere. Our international logistics partnerships enable seamless cross-border and intercontinental shipments.
            </p>
          </motion.div>

          <div className="space-y-12">
            {regions.map((region, regionIndex) => (
              <motion.div
                key={regionIndex}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: regionIndex * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-[#2563EB] hover:shadow-2xl transition-all duration-300"
              >
                <div className="mb-8">
                  <h3 className="text-3xl font-bold text-[#0F1F3D] mb-2">
                    {region.name}
                  </h3>
                  <p className="text-gray-600 text-lg">
                    {region.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {region.locations.map((location, locIndex) => (
                    <motion.div
                      key={locIndex}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (regionIndex * 0.1) + (locIndex * 0.05) }}
                      viewport={{ once: true }}
                      className="bg-gradient-to-br from-[#2563EB]/5 to-[#38BDF8]/5 rounded-lg p-4 text-center border border-[#2563EB]/20 hover:border-[#2563EB] hover:shadow-md transition-all"
                    >
                      <div className="font-semibold text-[#0F1F3D] text-sm mb-1">
                        {location}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 bg-gradient-to-br from-[#0F1F3D] via-[#1A365D] to-[#0F1F3D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-5xl font-bold mb-4">40+</div>
              <div className="text-xl text-gray-300">Distribution Centers</div>
              <p className="text-gray-400 mt-2">Across the US and Canada</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-5xl font-bold mb-4">7.5M+</div>
              <div className="text-xl text-gray-300">Square Feet</div>
              <p className="text-gray-400 mt-2">Of warehouse and logistics space</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-5xl font-bold mb-4">100+</div>
              <div className="text-xl text-gray-300">Years of Service</div>
              <p className="text-gray-400 mt-2">Founded in 1923</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-[#0F1F3D] mb-6">
              Ready to Partner With Us?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Contact our team to discuss your logistics needs and find the perfect solution for your business.
            </p>
            <a
              href={`mailto:${headquartersInfo.email}`}
              className="inline-block px-8 py-4 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
            >
              Contact Us Today
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
