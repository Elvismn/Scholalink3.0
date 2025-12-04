import { Menu, X } from 'lucide-react'

const MobileMenuButton = ({ isOpen, setIsOpen }) => {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 lg:hidden"
      onClick={() => setIsOpen(!isOpen)}
    >
      {isOpen ? (
        <X className="block h-6 w-6" />
      ) : (
        <Menu className="block h-6 w-6" />
      )}
    </button>
  )
}

export default MobileMenuButton