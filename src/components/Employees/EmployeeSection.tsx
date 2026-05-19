import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import personImg from '../../assets/person.jpg';

export const EmployeeSection = () => {
  const employees = [
    { name: 'Bjørn Johansen', role: 'Daglig Leder', email: 'bjorn@nordicdevices.no' },
    { name: 'Bjørnar Nilsen', role: 'Senior IT-Konsulent', email: 'bjornar@nordicdevices.no' },
    { name: 'Bjørne Bakke', role: 'Nettverksspesialist', email: 'bjorne@nordicdevices.no' },
    { name: 'Bjørn-Erik Larsen', role: 'Supportansvarlig', email: 'bjorn-erik@nordicdevices.no' }
  ];

  return (
    <section id="employees" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Møt våre ansatte</h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Vårt team av eksperter står klare til å hjelpe din bedrift med alle IT-utfordringer.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {employees.map((employee, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={personImg}
                  alt={employee.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-1">{employee.name}</h3>
                <p className="text-primary-600 font-medium text-sm mb-4">{employee.role}</p>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Mail className="h-4 w-4" />
                  <span>{employee.email}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
