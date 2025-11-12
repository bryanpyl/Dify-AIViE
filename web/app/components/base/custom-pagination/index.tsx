import React, {useMemo} from 'react'
import {
  RiArrowDropRightLine,
  RiArrowDropLeftLine
} from "@remixicon/react";
import { current } from 'immer';

interface CustomPaginationProps {
    limitPerPage?:number,
    totalData?: number, 
    currentPage: number, 
    onPageChange: (newPage:number) =>void; 

}

const CustomPagination:React.FC<CustomPaginationProps> = ({limitPerPage, totalData, currentPage, onPageChange})=>{
    const totalPage = useMemo(()=>{
        return Math.ceil(totalData!/limitPerPage!)
    }, [totalData, limitPerPage]) 

    const handleNextPage = ()=>{
        if (currentPage<totalPage){ 
            onPageChange(currentPage+1)
        }
    }

    const handlePrevChange = ()=>{
        if (currentPage>1){ 
            onPageChange(currentPage-1)
        }
    }

    return (
        <div className='flex flex-row px-2 my-1 space-x-2 items-center'>
            <div className={`${currentPage===1?'hover:cursor-not-allowed text-text-disabled':'hover:cursor-pointer hover:bg-gray-100 hover:text-text-primary'} transition-all duration-200 ease-in-out bg-gray-50 text-text-tertiary rounded-lg inset-shadow-md px-2 py-1 system-2xs-semibold-uppercase`} onClick={handlePrevChange}>
                <RiArrowDropLeftLine className='w-5 h-5'/>
            </div>
            <p className='system-2xs-semibold-uppercase text-text-tertiary'>Page {currentPage}/{totalPage}</p>
            <div className={`${currentPage===totalPage?"hover:cursor-not-allowed text-text-disabled":"hover:cursor-pointer hover:bg-gray-100 hover:text-text-primary"} transition-all duration-200 ease-in-out bg-gray-50 text-text-tertiary rounded-lg inset-shadow-md px-2 py-1 system-2xs-semibold-uppercase`} onClick={handleNextPage}>
                <RiArrowDropRightLine className='w-5 h-5'/>
            </div>
        </div>
    )
}

export default React.memo(CustomPagination)