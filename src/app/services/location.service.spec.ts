import { TestBed } from '@angular/core/testing';
import { LocationService, Province, District, Ward } from './location.service';

/**
 * Property-Based Tests for LocationService
 * 
 * Feature: profile-mystore-enhancements
 * Property 3: Cascading Province-District Filter
 * Property 4: Cascading District-Ward Filter
 * Validates: Requirements 3.6, 3.7
 */
describe('LocationService - Property-Based Tests', () => {
  let service: LocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Property 3: Cascading Province-District Filter
   * For any selected province, the district dropdown SHALL only contain 
   * districts where district.provinceCode === selectedProvince.code
   */
  describe('Property 3: Cascading Province-District Filter', () => {
    it('should return only districts belonging to the selected province', () => {
      const provinces = service.getProvinces();
      
      // Test for ALL provinces
      provinces.forEach(province => {
        const districts = service.getDistrictsByProvince(province.code);
        
        // Property: ALL returned districts must belong to the selected province
        districts.forEach(district => {
          expect(district.provinceCode).toBe(province.code);
        });
      });
    });

    it('should return empty array for non-existent province', () => {
      const districts = service.getDistrictsByProvince('NON_EXISTENT');
      expect(districts).toEqual([]);
    });

    it('should return different districts for different provinces', () => {
      const provinces = service.getProvinces();
      
      if (provinces.length >= 2) {
        const districts1 = service.getDistrictsByProvince(provinces[0].code);
        const districts2 = service.getDistrictsByProvince(provinces[1].code);
        
        // Districts from different provinces should not overlap
        const codes1 = new Set(districts1.map(d => d.code));
        const codes2 = new Set(districts2.map(d => d.code));
        
        const intersection = [...codes1].filter(code => codes2.has(code));
        expect(intersection.length).toBe(0);
      }
    });
  });

  /**
   * Property 4: Cascading District-Ward Filter
   * For any selected district, the ward dropdown SHALL only contain 
   * wards where ward.districtCode === selectedDistrict.code
   */
  describe('Property 4: Cascading District-Ward Filter', () => {
    it('should return only wards belonging to the selected district', () => {
      const provinces = service.getProvinces();
      
      // Test for ALL provinces and their districts
      provinces.forEach(province => {
        const districts = service.getDistrictsByProvince(province.code);
        
        districts.forEach(district => {
          const wards = service.getWardsByDistrict(district.code);
          
          // Property: ALL returned wards must belong to the selected district
          wards.forEach(ward => {
            expect(ward.districtCode).toBe(district.code);
          });
        });
      });
    });

    it('should return empty array for non-existent district', () => {
      const wards = service.getWardsByDistrict('NON_EXISTENT');
      expect(wards).toEqual([]);
    });

    it('should return different wards for different districts', () => {
      const provinces = service.getProvinces();
      
      if (provinces.length > 0) {
        const districts = service.getDistrictsByProvince(provinces[0].code);
        
        if (districts.length >= 2) {
          const wards1 = service.getWardsByDistrict(districts[0].code);
          const wards2 = service.getWardsByDistrict(districts[1].code);
          
          // Wards from different districts should not overlap
          const codes1 = new Set(wards1.map(w => w.code));
          const codes2 = new Set(wards2.map(w => w.code));
          
          const intersection = [...codes1].filter(code => codes2.has(code));
          expect(intersection.length).toBe(0);
        }
      }
    });
  });

  /**
   * Additional property tests for search functionality
   */
  describe('Search Properties', () => {
    it('should only return provinces matching the search query', () => {
      const allProvinces = service.getProvinces();
      
      allProvinces.forEach(province => {
        const searchResults = service.searchProvinces(province.name.substring(0, 3));
        
        // All results should contain the search query
        searchResults.forEach(result => {
          expect(result.name.toLowerCase()).toContain(province.name.substring(0, 3).toLowerCase());
        });
      });
    });

    it('should only return districts matching the search query within province', () => {
      const provinces = service.getProvinces();
      
      provinces.forEach(province => {
        const districts = service.getDistrictsByProvince(province.code);
        
        districts.forEach(district => {
          const searchResults = service.searchDistricts(province.code, district.name.substring(0, 3));
          
          // All results should belong to the province AND match the query
          searchResults.forEach(result => {
            expect(result.provinceCode).toBe(province.code);
            expect(result.name.toLowerCase()).toContain(district.name.substring(0, 3).toLowerCase());
          });
        });
      });
    });
  });
});
